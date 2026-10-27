import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

// Load .env from root or apps/api
const rootEnv = path.resolve(process.cwd(), "../../.env");
const localEnv = path.resolve(process.cwd(), ".env");

if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

export const config = {
  port: parseInt(process.env.API_PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  redisUrl: process.env.REDIS_URL || "",
  storage: {
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
    bucket: process.env.S3_BUCKET || "pagelabs",
    accessKey: process.env.S3_ACCESS_KEY || "minioadmin",
    secretKey: process.env.S3_SECRET_KEY || "minioadmin",
    region: process.env.S3_REGION || "auto",
  },
  limits: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || "100", 10),
    maxFilesPerJob: parseInt(process.env.MAX_FILES_PER_JOB || "20", 10),
    jobTtlHours: parseInt(process.env.JOB_TTL_HOURS || "2", 10),
    jobTimeoutSeconds: parseInt(process.env.JOB_TIMEOUT_SECONDS || "300", 10),
  },
  rateLimit: {
    anonLimit: parseInt(process.env.RATE_LIMIT_ANON || "10", 10),
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};
