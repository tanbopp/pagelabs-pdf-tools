import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { type JobRecord, type JobStatus } from "@pagelabs/shared";

const dbDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "pagelabs.db");
const db = new Database(dbPath);

// Initialize schema (compatible with PRD §5.3)
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    tool TEXT NOT NULL,
    status TEXT NOT NULL,
    files TEXT NOT NULL,
    options TEXT,
    result_url TEXT,
    result_size INTEGER,
    error_code TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL,
    started_at TEXT,
    completed_at TEXT,
    expires_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_expires ON jobs(expires_at);
`);

export const jobDb = {
  create(job: {
    id: string;
    tool: string;
    status: JobStatus;
    files: unknown;
    options?: unknown;
    expires_at: string;
    created_at: string;
  }) {
    const stmt = db.prepare(`
      INSERT INTO jobs (id, tool, status, files, options, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      job.id,
      job.tool,
      job.status,
      JSON.stringify(job.files),
      job.options ? JSON.stringify(job.options) : null,
      job.created_at,
      job.expires_at
    );
  },

  get(id: string): JobRecord | null {
    const stmt = db.prepare("SELECT * FROM jobs WHERE id = ?");
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: row.id as string,
      tool: row.tool as string,
      status: row.status as JobStatus,
      files: JSON.parse(row.files as string),
      options: row.options ? JSON.parse(row.options as string) : null,
      result_url: (row.result_url as string) || null,
      result_size: (row.result_size as number) || null,
      error_code: (row.error_code as string) || null,
      error_message: (row.error_message as string) || null,
      created_at: row.created_at as string,
      started_at: (row.started_at as string) || null,
      completed_at: (row.completed_at as string) || null,
      expires_at: row.expires_at as string,
    };
  },

  updateStatus(
    id: string,
    update: {
      status: JobStatus;
      started_at?: string;
      completed_at?: string;
      result_url?: string;
      result_size?: number;
      error_code?: string;
      error_message?: string;
    }
  ) {
    const sets: string[] = ["status = ?"];
    const params: unknown[] = [update.status];

    if (update.started_at !== undefined) {
      sets.push("started_at = ?");
      params.push(update.started_at);
    }
    if (update.completed_at !== undefined) {
      sets.push("completed_at = ?");
      params.push(update.completed_at);
    }
    if (update.result_url !== undefined) {
      sets.push("result_url = ?");
      params.push(update.result_url);
    }
    if (update.result_size !== undefined) {
      sets.push("result_size = ?");
      params.push(update.result_size);
    }
    if (update.error_code !== undefined) {
      sets.push("error_code = ?");
      params.push(update.error_code);
    }
    if (update.error_message !== undefined) {
      sets.push("error_message = ?");
      params.push(update.error_message);
    }

    params.push(id);
    const stmt = db.prepare(`UPDATE jobs SET ${sets.join(", ")} WHERE id = ?`);
    stmt.run(...params);
  },

  updateOptions(id: string, options: Record<string, unknown>) {
    const stmt = db.prepare("UPDATE jobs SET options = ? WHERE id = ?");
    stmt.run(JSON.stringify(options), id);
  },

  delete(id: string) {
    const stmt = db.prepare("DELETE FROM jobs WHERE id = ?");
    stmt.run(id);
  },

  purgeExpired(): { id: string; result_url: string | null }[] {
    const now = new Date().toISOString();
    const selectStmt = db.prepare(
      "SELECT id, result_url FROM jobs WHERE expires_at < ? AND status IN ('completed', 'failed')"
    );
    const rows = selectStmt.all(now) as { id: string; result_url: string | null }[];
    if (rows.length > 0) {
      const deleteStmt = db.prepare(
        "DELETE FROM jobs WHERE expires_at < ? AND status IN ('completed', 'failed')"
      );
      deleteStmt.run(now);
    }
    return rows;
  },
};
