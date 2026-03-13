import pino from 'pino'
import {
  getLogLevel,
  isPrettyPrintEnabled,
  createRedactConfig,
  createGcpFormatters,
  createPrettyTransport,
  createTimestamp,
} from '@core/logger-config'

/**
 * Pino logger for the presentation layer.
 * Use only in server-side code (API routes, server actions, RSC, server-only modules).
 * Do not import in client components or client-side code.
 *
 * In development we skip the pino-pretty transport (worker thread) so logs go to
 * the main process stdout and show in the Next.js dev terminal.
 */
function createLogger() {
  const useTransport =
    process.env.NODE_ENV !== 'development' && isPrettyPrintEnabled()
  return pino({
    level: getLogLevel(),
    redact: createRedactConfig(),
    formatters: createGcpFormatters('presentation'),
    timestamp: () => createTimestamp(),
    ...(useTransport ? { transport: createPrettyTransport() } : { dest: 1 }),
  })
}

export const logger = createLogger()

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings)
}
