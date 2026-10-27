import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { config } from "./config.js";

// Local storage directory
const storageDir = path.resolve(process.cwd(), "storage");
const uploadsDir = path.join(storageDir, "uploads");
const resultsDir = path.join(storageDir, "results");

for (const dir of [storageDir, uploadsDir, resultsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const fileStorage = {
  getUploadPath(fileId: string): string {
    return path.join(uploadsDir, fileId);
  },

  getResultPath(fileId: string): string {
    return path.join(resultsDir, fileId);
  },

  createSignedUpload(filename: string): {
    uploadUrl: string;
    fileUrl: string;
    expiresAt: string;
  } {
    const fileId = `${crypto.randomUUID()}_${path.basename(filename)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry per PRD §5.9
    const baseUrl = `http://localhost:${config.port}/api/v1`;

    return {
      uploadUrl: `${baseUrl}/uploads/raw/${fileId}`,
      fileUrl: `${baseUrl}/uploads/raw/${fileId}`,
      expiresAt,
    };
  },

  delete(filePath: string) {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
    }
  },
};
