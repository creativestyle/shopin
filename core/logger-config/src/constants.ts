/**
 * Pino log levels mapped to GCP Cloud Logging severity levels.
 * @see https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#LogSeverity
 */
export const LEVEL_TO_SEVERITY: Record<string, string> = {
  trace: "DEBUG",
  debug: "DEBUG",
  info: "INFO",
  warn: "WARNING",
  error: "ERROR",
  fatal: "CRITICAL",
};

/** Sensitive field names to redact at root and up to 2 levels deep (fast-redact: avoid 3+ wildcards). */
const REDACT_KEYS = [
  "password",
  "currentPassword",
  "newPassword",
  "token",
  "tokenValue",
  "accessToken",
  "refreshToken",
  "emailToken",
  "csrfToken",
  "secret",
  "apiKey",
  "email",
] as const;

/** Paths not covered by REDACT_KEYS (e.g. header names that are not generic keys). */
const REDACT_PATHS_FIXED = [
  "req.headers.authorization",
  "req.headers.cookie",
  'req.headers["x-csrf-token"]',
];

/** Paths to redact (Pino/fast-redact). Generic keys expanded to key, *.key, *.*.key. */
export const REDACT_PATHS: string[] = [
  ...REDACT_PATHS_FIXED,
  ...REDACT_KEYS.flatMap((k) => [k, `*.${k}`, `*.*.${k}`]),
];

/**
 * Default censor string for redacted values.
 */
export const REDACT_CENSOR = "[REDACTED]";

/** Pino log levels (threshold: level and above are logged). */
export const LOG_LEVELS = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];
