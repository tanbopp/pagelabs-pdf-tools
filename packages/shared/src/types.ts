import { z } from "zod";

export type JobStatus =
  | "queued"
  | "processing"
  | "validating"
  | "completed"
  | "failed";

export interface JobFileInput {
  url: string;
  name: string;
  size: number;
}

export interface JobRecord {
  id: string;
  tool: string;
  status: JobStatus;
  files: JobFileInput[];
  options: Record<string, unknown> | null;
  result_url?: string | null;
  result_size?: number | null;
  error_code?: string | null;
  error_message?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  expires_at: string;
}

export const createJobSchema = z.object({
  tool: z.string().min(1),
  files: z
    .array(
      z.object({
        url: z.string().min(1),
        name: z.string().min(1),
        size: z.number().positive(),
      })
    )
    .min(1),
  options: z.record(z.unknown()).optional(),
});

export type CreateJobRequest = z.infer<typeof createJobSchema>;

export interface CreateJobResponse {
  jobId: string;
  status: JobStatus;
  pollUrl: string;
}

export const signUploadSchema = z.object({
  filename: z.string().min(1),
  size: z.number().positive(),
  contentType: z.string().min(1),
});

export type SignUploadRequest = z.infer<typeof signUploadSchema>;

export interface SignUploadResponse {
  uploadUrl: string;
  fileUrl: string;
  expiresAt: string;
}
