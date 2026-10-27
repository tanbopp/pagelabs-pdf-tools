import { Hono } from "hono";
import { cors } from "hono/cors";
import crypto from "node:crypto";
import fs from "node:fs";
import { serve } from "@hono/node-server";
import { config } from "./config.js";
import { log } from "./logger.js";
import { jobDb } from "./db.js";
import { fileStorage } from "./storage.js";
import { enqueueJob } from "./queue.js";
import { rateLimiter } from "./rate-limit.js";
import {
  createJobSchema,
  signUploadSchema,
  TOOL_REGISTRY,
  mergePdfOptionsSchema,
} from "@pagelabs/shared";

const app = new Hono();

// CORS restricted to frontend
app.use(
  "*",
  cors({
    origin: (origin) => {
      // allow localhost dev ports
      if (!origin || origin.startsWith("http://localhost:")) return origin;
      return "http://localhost:3000";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Security headers per PRD §8.3
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
});

// Health check endpoint
app.get("/api/v1/health", (c) => {
  return c.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Purge Cron runner (every 10 minutes per PRD §5.4 & §8.2)
setInterval(() => {
  try {
    const purged = jobDb.purgeExpired();
    for (const job of purged) {
      if (job.result_url && fs.existsSync(job.result_url)) {
        fileStorage.delete(job.result_url);
      }
    }
    if (purged.length > 0) {
      log({
        event: "purge.completed",
        purged_count: purged.length,
      });
    }
  } catch (err) {
    log({
      level: "error",
      event: "purge.failed",
      error: String(err),
    });
  }
}, 10 * 60 * 1000);

// Upload sign endpoint (PRD §5.2)
app.post("/api/v1/uploads/sign", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = signUploadSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error_code: "INVALID_REQUEST",
          error_message: parsed.error.issues[0]?.message || "Invalid payload",
        },
        400
      );
    }

    const { filename, size } = parsed.data;

    if (size > config.limits.maxFileSizeMB * 1024 * 1024) {
      return c.json(
        {
          error_code: "FILE_TOO_LARGE",
          error_message: `File exceeds maximum allowed size of ${config.limits.maxFileSizeMB}MB`,
        },
        400
      );
    }

    const signed = fileStorage.createSignedUpload(filename);
    return c.json(signed);
  } catch (err) {
    return c.json(
      {
        error_code: "SERVER_ERROR",
        error_message: "Failed to generate upload URL",
      },
      500
    );
  }
});

// Upload raw handler (for dev/local direct binary upload via PUT)
app.put("/api/v1/uploads/raw/:fileId", async (c) => {
  const fileId = c.req.param("fileId");
  const filePath = fileStorage.getUploadPath(fileId);

  const arrayBuffer = await c.req.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

  return c.json({ status: "uploaded", fileId });
});

// Apply rate limiter to /jobs
app.use("/api/v1/jobs", rateLimiter);

// Create Job endpoint (PRD §5.1 & §5.6)
app.post("/api/v1/jobs", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error_code: "INVALID_REQUEST",
          error_message: parsed.error.issues[0]?.message || "Invalid payload",
        },
        400
      );
    }

    const { tool, files, options } = parsed.data;

    // 1. Tool check
    const toolDef = TOOL_REGISTRY[tool];
    if (!toolDef) {
      return c.json(
        {
          error_code: "INVALID_TOOL",
          error_message: `Tool '${tool}' does not exist in registry`,
        },
        400
      );
    }

    // 2. Availability check (Phase 1 only merge-pdf is available)
    if (!toolDef.available) {
      return c.json(
        {
          error_code: "TOOL_NOT_AVAILABLE",
          error_message: `Tool '${tool}' is not available yet`,
        },
        400
      );
    }

    // 3. File count check
    if (files.length < toolDef.minFiles || files.length > toolDef.maxFiles) {
      return c.json(
        {
          error_code: "INVALID_FILE_COUNT",
          error_message: `Number of files must be between ${toolDef.minFiles} and ${toolDef.maxFiles}`,
        },
        400
      );
    }

    // 4. File size check
    const maxSizeBytes = config.limits.maxFileSizeMB * 1024 * 1024;
    for (const f of files) {
      if (f.size > maxSizeBytes) {
        return c.json(
          {
            error_code: "FILE_TOO_LARGE",
            error_message: `File exceeds maximum allowed size of ${config.limits.maxFileSizeMB}MB`,
          },
          400
        );
      }
    }

    // 5. Options schema validation
    if (toolDef.optionsSchema && options) {
      const optCheck = toolDef.optionsSchema.safeParse(options);
      if (!optCheck.success) {
        return c.json(
          {
            error_code: "INVALID_OPTIONS",
            error_message: optCheck.error.issues[0]?.message || "Invalid tool options",
          },
          400
        );
      }
    }

    // Create Job in DB
    const jobId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(
      Date.now() + config.limits.jobTtlHours * 60 * 60 * 1000
    ).toISOString();

    jobDb.create({
      id: jobId,
      tool,
      status: "queued",
      files,
      options: options || {},
      created_at: createdAt,
      expires_at: expiresAt,
    });

    log({
      event: "job.created",
      job_id: jobId,
      tool,
      file_count: files.length,
      total_size: files.reduce((acc, f) => acc + f.size, 0),
    });

    // Enqueue
    enqueueJob(jobId);

    return c.json(
      {
        jobId,
        status: "queued",
        pollUrl: `/api/v1/jobs/${jobId}`,
      },
      201
    );
  } catch (err) {
    return c.json(
      {
        error_code: "SERVER_ERROR",
        error_message: "Failed to create job",
      },
      500
    );
  }
});

// Polling status endpoint (PRD §5.1)
app.get("/api/v1/jobs/:id", (c) => {
  const id = c.req.param("id");
  const job = jobDb.get(id);

  if (!job) {
    return c.json(
      {
        error_code: "JOB_NOT_FOUND",
        error_message: "Job not found",
      },
      404
    );
  }

  return c.json({
    id: job.id,
    tool: job.tool,
    status: job.status,
    result_url: job.result_url ? `/api/v1/jobs/${job.id}/result` : null,
    result_size: job.result_size,
    error_code: job.error_code,
    error_message: job.error_message,
    created_at: job.created_at,
    completed_at: job.completed_at,
  });
});

// Result download redirect endpoint (PRD §5.1)
app.get("/api/v1/jobs/:id/result", (c) => {
  const id = c.req.param("id");
  const job = jobDb.get(id);

  if (!job || job.status !== "completed" || !job.result_url) {
    return c.json(
      {
        error_code: "RESULT_NOT_READY",
        error_message: "Job result is not available",
      },
      404
    );
  }

  if (fs.existsSync(job.result_url)) {
    const fileBuffer = fs.readFileSync(job.result_url);
    const filename =
      ((job.options as Record<string, unknown>)?.outputFilename as string) ||
      (job.result_url.endsWith(".zip") ? "result.zip" : "result.pdf");

    let contentType = "application/octet-stream";
    const lowerName = filename.toLowerCase();
    if (lowerName.endsWith(".pdf")) contentType = "application/pdf";
    else if (lowerName.endsWith(".zip")) contentType = "application/zip";
    else if (lowerName.endsWith(".docx")) contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (lowerName.endsWith(".xlsx")) contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (lowerName.endsWith(".pptx")) contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (lowerName.endsWith(".png")) contentType = "image/png";

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  }

  return c.json(
    {
      error_code: "RESULT_NOT_FOUND",
      error_message: "Result file not found on disk",
    },
    404
  );
});

// Delete/Purge manual endpoint (PRD §5.1)
app.delete("/api/v1/jobs/:id", (c) => {
  const id = c.req.param("id");
  const job = jobDb.get(id);

  if (!job) {
    return c.json({ status: "not_found" }, 404);
  }

  if (job.result_url && fs.existsSync(job.result_url)) {
    fileStorage.delete(job.result_url);
  }

  jobDb.delete(id);
  log({ event: "job.deleted_manually", job_id: id });

  return c.json({ status: "deleted" });
});

serve({
  fetch: app.fetch,
  port: config.port,
});

log({
  event: "api.started",
  port: config.port,
});
