import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { jobDb } from "./db.js";
import { log } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Queue for job processing
interface QueuedJob {
  jobId: string;
}

const jobQueue: QueuedJob[] = [];
let isWorkerActive = false;

export function enqueueJob(jobId: string) {
  jobQueue.push({ jobId });
  processNextJob();
}

async function processNextJob() {
  if (isWorkerActive || jobQueue.length === 0) return;

  const item = jobQueue.shift();
  if (!item) return;

  isWorkerActive = true;
  const { jobId } = item;

  const job = jobDb.get(jobId);
  if (!job) {
    isWorkerActive = false;
    processNextJob();
    return;
  }

  const startTime = Date.now();
  jobDb.updateStatus(jobId, {
    status: "processing",
    started_at: new Date().toISOString(),
  });

  log({
    event: "job.processing_started",
    job_id: jobId,
    tool: job.tool,
  });

  // Execute python worker script with tool-specific timeout (600s for OCR per PRD 3 §3.3)
  const isOcr = job.tool === "ocr-pdf";
  const timeoutMs = isOcr ? 600 * 1000 : config.limits.jobTimeoutSeconds * 1000;

  // Robust worker script path resolving regardless of process.cwd()
  const workerDir = path.resolve(__dirname, "../../worker");
  const workerScript = path.resolve(workerDir, "src/runner.py");

  // Determine python executable path (check process.env.PYTHON_PATH, C:\Python313\python.exe, or fallback to python)
  let pythonBin = process.env.PYTHON_PATH || "python";
  if (process.platform === "win32") {
    if (fs.existsSync("C:\\Python313\\python.exe")) {
      pythonBin = "C:\\Python313\\python.exe";
    }
  }

  const runnerProcess = spawn(pythonBin, [workerScript, jobId], {
    env: { ...process.env },
    cwd: workerDir,
  });

  runnerProcess.on("error", (err) => {
    clearTimeout(timer);
    jobDb.updateStatus(jobId, {
      status: "failed",
      completed_at: new Date().toISOString(),
      error_code: "WORKER_SPAWN_ERROR",
      error_message: `Worker spawn failed: ${err.message}`,
    });
    log({
      level: "error",
      event: "job.failed",
      job_id: jobId,
      error_code: "WORKER_SPAWN_ERROR",
      error: err.message,
    });
    isWorkerActive = false;
    processNextJob();
  });

  let stdout = "";
  let stderr = "";
  let isTimedOut = false;

  const timer = setTimeout(() => {
    isTimedOut = true;
    runnerProcess.kill();
  }, timeoutMs);

  runnerProcess.stdout.on("data", (data) => {
    stdout += data.toString();
  });

  runnerProcess.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  runnerProcess.on("close", (code) => {
    clearTimeout(timer);
    const duration_ms = Date.now() - startTime;

    if (isTimedOut) {
      jobDb.updateStatus(jobId, {
        status: "failed",
        completed_at: new Date().toISOString(),
        error_code: "TIMEOUT",
        error_message: "Job execution timed out",
      });
      log({
        level: "error",
        event: "job.failed",
        job_id: jobId,
        error_code: "TIMEOUT",
      });
      isWorkerActive = false;
      processNextJob();
      return;
    }
    if (code === 0) {
      try {
        const lines = stdout.trim().split("\n");
        let result: any = null;
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith("{") && line.endsWith("}")) {
            try {
              result = JSON.parse(line);
              break;
            } catch { }
          }
        }
        if (!result) {
          throw new Error("No JSON output found from worker");
        }

        jobDb.updateStatus(jobId, {
          status: "completed",
          completed_at: new Date().toISOString(),
          result_url: result.result_url,
          result_size: result.result_size,
        });

        // Security requirement: Sanitize passwords from job options immediately upon job completion
        const finishedJob = jobDb.get(jobId);
        if (finishedJob?.options && typeof finishedJob.options === "object" && "password" in finishedJob.options) {
          const sanitizedOptions = { ...finishedJob.options };
          delete (sanitizedOptions as Record<string, unknown>).password;
          jobDb.updateOptions(jobId, sanitizedOptions);
        }

        log({
          event: "job.completed",
          job_id: jobId,
          duration_ms,
          result_size: result.result_size,
        });
      } catch (err) {
        jobDb.updateStatus(jobId, {
          status: "failed",
          completed_at: new Date().toISOString(),
          error_code: "PROCESSING_FAILED",
          error_message: "Worker returned invalid response",
        });

        const failedJob = jobDb.get(jobId);
        if (failedJob?.options && typeof failedJob.options === "object" && "password" in failedJob.options) {
          const sanitizedOptions = { ...failedJob.options };
          delete (sanitizedOptions as Record<string, unknown>).password;
          jobDb.updateOptions(jobId, sanitizedOptions);
        }

        log({
          level: "error",
          event: "job.failed",
          job_id: jobId,
          error_code: "PROCESSING_FAILED",
        });
      }
    } else {
      let errorCode = "PROCESSING_FAILED";
      let errorMsg = "Failed to process PDF";

      try {
        const errObj = JSON.parse(stderr.trim() || stdout.trim());
        if (errObj.error_code) errorCode = errObj.error_code;
        if (errObj.error_message) errorMsg = errObj.error_message;
      } catch {
        if (stderr.includes("Password") || stderr.includes("password")) {
          errorCode = "PASSWORD_PROTECTED";
          errorMsg = "One file is password-protected";
        }
      }

      jobDb.updateStatus(jobId, {
        status: "failed",
        completed_at: new Date().toISOString(),
        error_code: errorCode,
        error_message: errorMsg,
      });

      log({
        level: "error",
        event: "job.failed",
        job_id: jobId,
        error_code: errorCode,
      });
    }

    isWorkerActive = false;
    processNextJob();
  });
}
