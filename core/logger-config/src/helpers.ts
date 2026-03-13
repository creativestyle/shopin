import {
  LEVEL_TO_SEVERITY,
  REDACT_PATHS,
  REDACT_CENSOR,
  type LogLevel,
} from "./constants";

export function isPrettyPrintEnabled(): boolean {
  return process.env.LOG_PRETTY_PRINT === "true";
}

/** Log level from LOG_LEVEL env or 'info'. */
export function getLogLevel(): LogLevel {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL as LogLevel;
  }
  return "info";
}

/**
 * Maps a Pino log level to GCP Cloud Logging severity.
 */
export function getGcpSeverity(level: string): string {
  return LEVEL_TO_SEVERITY[level] || level.toUpperCase();
}

/** UUID v4 pattern (8-4-4-4-12 hex). */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns true if the value matches a format we generate (UUID v4).
 * Used to reject invalid or malicious header values and avoid log pollution.
 */
export function isValidCorrelationId(value: string): boolean {
  if (typeof value !== "string" || value.length === 0 || value.length > 64) {
    return false;
  }
  return UUID_V4_REGEX.test(value);
}

/**
 * Generates a new correlation ID (UUID v4).
 * Uses globalThis.crypto.randomUUID (Node 19+, all modern browsers).
 */
export function generateCorrelationId(): string {
  return globalThis.crypto.randomUUID();
}

/**
 * Creates the base Pino redact configuration.
 */
export function createRedactConfig() {
  return {
    paths: REDACT_PATHS,
    censor: REDACT_CENSOR,
  };
}

/**
 * Creates GCP-compatible formatters for Pino.
 *
 * @param serviceName - Name of the service for log identification
 */
export function createGcpFormatters(serviceName: string) {
  return {
    level: (label: string) => ({
      severity: getGcpSeverity(label),
    }),
    bindings: (bindings: { name?: string }) => ({
      service: bindings.name || serviceName,
    }),
    log: (object: Record<string, unknown>) => ({
      ...object,
      correlationId: object.reqId ?? object.correlationId,
      reqId: undefined,
    }),
  };
}

/**
 * Creates ISO timestamp formatter for GCP Cloud Logging.
 */
export function createTimestamp(): string {
  return `,"time":"${new Date().toISOString()}"`;
}

/**
 * Creates pino-pretty transport configuration for local development.
 */
export function createPrettyTransport() {
  return {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:HH:MM:ss",
      ignore: "pid,hostname,service",
      singleLine: false,
    },
  };
}
