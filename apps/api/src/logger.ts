type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  event: string;
  level?: LogLevel;
  [key: string]: unknown;
}

export function log(payload: LogPayload) {
  const { level = "info", event, ...rest } = payload;
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...rest,
  };
  // Print structured JSON per PRD §5.8 (Forbidden: raw filename, file content, passwords, full signed URLs)
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
