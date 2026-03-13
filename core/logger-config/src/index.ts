export {
  LEVEL_TO_SEVERITY,
  REDACT_PATHS,
  REDACT_CENSOR,
  LOG_LEVELS,
  type LogLevel,
} from "./constants";

export {
  isPrettyPrintEnabled,
  getLogLevel,
  getGcpSeverity,
  generateCorrelationId,
  isValidCorrelationId,
  createRedactConfig,
  createGcpFormatters,
  createTimestamp,
  createPrettyTransport,
} from "./helpers";
