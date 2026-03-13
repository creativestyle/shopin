import type { Request } from 'express'
import type { Params } from 'nestjs-pino'
import { CORRELATION_ID_HEADER } from '@config/constants'
import {
  getLogLevel,
  isPrettyPrintEnabled,
  generateCorrelationId,
  isValidCorrelationId,
  createRedactConfig,
  createGcpFormatters,
  createTimestamp,
  createPrettyTransport,
} from '@core/logger-config'

function getCorrelationId(req: Request): string {
  const existingId = req.headers[CORRELATION_ID_HEADER]
  if (typeof existingId === 'string' && isValidCorrelationId(existingId)) {
    return existingId
  }
  return generateCorrelationId()
}

function shouldSkipRequestLog(req: Request): boolean {
  const path = (req.url ?? '').split('?')[0]
  return (
    path === '/bff/health' ||
    path === '/bff/ready' ||
    path === '/health' ||
    path === '/ready'
  )
}

/**
 * BFF HTTP logging config. For developer rules and log shape, see docs/LOGGING.md.
 */

/** Request extension set by HttpErrorFilter so pino-http can include exception in the log. */
export type NestExceptionForLog = {
  name: string
  message: string
  stack?: string
}

/**
 * Pino config for BFF. Aligns with common best practices:
 *
 * - Single HTTP logger: pino-http logs every request (one line per request); no duplicate
 *   logging from filters. Express/Node guidance: use one logger instance, avoid console.
 * - customLogLevel by status: info (2xx), warn (4xx), error (5xx) — matches pino-http README.
 * - Correlation ID: genReqId from header or generated; in customProps for structured logs
 *   and traceability (correlation IDs in JSON logs are standard for observability).
 * - Exception in one place: filter attaches __nestException to req; pino-http includes it
 *   via customProps so error name/message/stack appear in the same log line (Nest doesn’t
 *   pass exceptions to pino-http’s err, so we use request attachment).
 * - Redaction, GCP formatters, health-path skip: see @core/logger-config.
 */
export function createLoggerConfig(): Params {
  const gcpFormatters = createGcpFormatters('bff')

  return {
    pinoHttp: {
      level: getLogLevel(),
      genReqId: (req) => getCorrelationId(req as Request),
      redact: createRedactConfig(),

      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          // Path only (no query string) to avoid logging tokens, OAuth codes, API keys, etc.
          path: (req.url ?? '').split('?')[0],
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },

      formatters: gcpFormatters,
      timestamp: createTimestamp,
      transport: isPrettyPrintEnabled() ? createPrettyTransport() : undefined,

      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) {
          return 'error'
        }
        if (res.statusCode >= 400) {
          return 'warn'
        }
        return 'info'
      },

      autoLogging: { ignore: (req) => shouldSkipRequestLog(req as Request) },

      customSuccessMessage: (_req, res, responseTime) =>
        `request completed ${res.statusCode} (${responseTime}ms)`,

      customProps: (req) => {
        const request = req as Request & {
          id?: string
          __nestException?: NestExceptionForLog
        }
        const props: Record<string, unknown> = {
          correlationId: request.id,
        }
        if (request.__nestException) {
          props.error = request.__nestException
        }
        return props
      },
    },
  }
}
