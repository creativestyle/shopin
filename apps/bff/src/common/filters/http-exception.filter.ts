import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import type { Request } from 'express'
import type { ZodError } from 'zod'
import { PUBLIC_ERROR_CODES } from '@core/contracts/core/error-codes'
import type { NestExceptionForLog } from '../logger/logger.config'
import { FrontendInputValidationException } from '../validation/frontend-input-validation.exception'
import { FrontendSafeException } from '../errors/frontend-safe.exception'

/** Machine-readable discriminator our own exceptions may attach to any status. */
type ErrorCode = {
  code?: string
  /** 502–504 of a port serving through others (`delegates`): the category and provider whose platform failed (ids, no message). */
}

type ErrorBody = ErrorCode &
  (
    | { statusCode: 400; message: string; issues?: ZodError['issues'] }
    | { statusCode: 400; message: string; reason: string }
    | { statusCode: 401; message: string }
    | { statusCode: 403; message: string }
    | { statusCode: 404; message: string }
    | { statusCode: 409; message: string }
    | { statusCode: 429; message: string }
    | { statusCode: 500; message: string }
    | { statusCode: 501; message: string }
    | { statusCode: 502; message: string }
    | { statusCode: 503; message: string }
    | { statusCode: 504; message: string }
  )

const STATUS_BODY_MAP: Record<number, ErrorBody> = {
  [HttpStatus.BAD_REQUEST]: {
    statusCode: 400,
    message: 'Validation failed',
    issues: [] as ZodError['issues'],
  },
  [HttpStatus.UNAUTHORIZED]: {
    statusCode: 401,
    message: 'Unauthorized',
  },
  [HttpStatus.FORBIDDEN]: {
    statusCode: 403,
    message: 'Forbidden',
  },
  [HttpStatus.NOT_FOUND]: { statusCode: 404, message: 'Not Found' },
  [HttpStatus.CONFLICT]: { statusCode: 409, message: 'Conflict' },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    statusCode: 429,
    message: 'Too many requests',
  },
  // server-side statuses a caller acts on: a missing feature, and an upstream platform that failed, is down
  // (retry later) or timed out. The body stays generic; the message is logged, never sent.
  [HttpStatus.NOT_IMPLEMENTED]: { statusCode: 501, message: 'Not implemented' },
  [HttpStatus.BAD_GATEWAY]: { statusCode: 502, message: 'Bad gateway' },
  [HttpStatus.SERVICE_UNAVAILABLE]: {
    statusCode: 503,
    message: 'Service unavailable',
  },
  [HttpStatus.GATEWAY_TIMEOUT]: { statusCode: 504, message: 'Gateway timeout' },
}

const DEFAULT_ERROR_BODY: ErrorBody = {
  statusCode: 500,
  message: 'Internal server error',
}

/** Error names vendor SDKs give an upstream 5xx (the HTTP status text). */
const UPSTREAM_NAMES: Record<string, number> = {
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  // an SDK whose every host failed or timed out
  RetryError: 503,
  // fetch's AbortSignal.timeout(), an aborted request
  TimeoutError: 504,
  AbortError: 504,
}
/** Network error codes (Node, undici, axios): the platform cannot be reached (503) or did not answer in time (504). */
const UPSTREAM_CODES: Record<string, number> = {
  ECONNREFUSED: 503,
  ECONNRESET: 503,
  ENOTFOUND: 503,
  EAI_AGAIN: 503,
  EHOSTUNREACH: 503,
  ETIMEDOUT: 504,
  ECONNABORTED: 504,
  UND_ERR_CONNECT_TIMEOUT: 504,
}

/**
 * The status of a vendor SDK's or the network's error that is not a Nest exception: a platform that failed (502),
 * is down or unreachable (503) or timed out (504), read from the error and its `cause` chain (fetch wraps the
 * network error in `cause`). Undefined for anything else (a bug stays 500).
 */
function upstreamStatus(error: unknown): number | undefined {
  let e = error
  for (let depth = 0; depth < 4 && e && typeof e === 'object'; depth++) {
    const x = e as {
      statusCode?: unknown
      status?: unknown
      response?: { status?: unknown }
      code?: unknown
      name?: unknown
      cause?: unknown
    }
    const status = [x.statusCode, x.status, x.response?.status].find(
      (s) => typeof s === 'number'
    ) as number | undefined
    if (status !== undefined && status >= 502 && status <= 504) {
      return status
    }
    const byCode =
      typeof x.code === 'string' ? UPSTREAM_CODES[x.code] : undefined
    const byName =
      typeof x.name === 'string' && status === undefined
        ? UPSTREAM_NAMES[x.name]
        : undefined
    if (byCode ?? byName) {
      return byCode ?? byName
    }
    e = x.cause
  }
  return undefined
}

type RequestWithNestException = Request & {
  __nestException?: NestExceptionForLog
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest<RequestWithNestException>()

    const status = this.getStatusFromException(exception)
    const body = this.mapExceptionToErrorBody(exception, status)
    this.attachExceptionForLog(exception, request, status)

    response.status(body.statusCode).json(body)
  }

  private getStatusFromException(exception: unknown): number {
    // Check for Resource Owner Password Credentials Grant message first
    // This happens when anonymous tokens are used to access endpoints that require password grant tokens
    // This is a 403 Forbidden (authorization issue) not 401 Unauthorized (authentication issue)
    // because the user has valid credentials but insufficient permissions (wrong grant type)
    if (exception instanceof Error) {
      const message = exception.message
      if (
        typeof message === 'string' &&
        message.includes('Resource Owner Password Credentials Grant')
      ) {
        return HttpStatus.FORBIDDEN
      }
    }

    if (exception instanceof HttpException) {
      return exception.getStatus()
    }
    if (exception instanceof Error && exception.message === 'invalid_token') {
      return HttpStatus.UNAUTHORIZED
    }
    // a vendor SDK's or the network's own error: the platform failed, is down or timed out
    return upstreamStatus(exception) ?? HttpStatus.INTERNAL_SERVER_ERROR
  }

  private mapExceptionToErrorBody(
    exception: unknown,
    status: number
  ): ErrorBody {
    // FrontendInputValidationException is the only validation error we can safely expose to the frontend.
    // Other validation errors should result in 500 without exposing details to prevent information leakage.
    if (exception instanceof FrontendInputValidationException) {
      const baseError = STATUS_BODY_MAP[HttpStatus.BAD_REQUEST]
      return {
        ...baseError,
        issues: exception.issues,
      } as ErrorBody
    }

    // Carries an explicit reason code the frontend maps to a specific message.
    if (exception instanceof FrontendSafeException) {
      return {
        statusCode: 400,
        message: 'Bad request',
        reason: exception.reason,
      }
    }

    const body = STATUS_BODY_MAP[status] ?? DEFAULT_ERROR_BODY

    // Only allow-listed codes are forwarded, never the exception message
    const code = this.getPublicErrorCode(exception)
    if (code) {
      const message =
        status === HttpStatus.BAD_REQUEST ? 'Bad Request' : body.message
      return { statusCode: body.statusCode, message, code } as ErrorBody
    }

    // a route's own 400 (SHOPin's or a shop route's `BadRequestException('q: 2 to 100 characters')`) says what to
    // fix in its own words; "Validation failed" with issues is the input validation's (above)
    if (exception instanceof BadRequestException) {
      const own = exception.getResponse()
      const message =
        typeof own === 'string'
          ? own
          : (own as { message?: unknown } | null)?.message
      if (typeof message === 'string' && message) {
        return { statusCode: 400, message }
      }
    }

    return body
  }

  private getPublicErrorCode(exception: unknown): string | undefined {
    if (!(exception instanceof HttpException)) {
      return undefined
    }

    const response = exception.getResponse()
    if (response === null || typeof response !== 'object') {
      return undefined
    }

    const code = (response as { code?: unknown }).code
    return typeof code === 'string' && PUBLIC_ERROR_CODES.has(code)
      ? code
      : undefined
  }

  /** Attach exception to request so pino-http can include it when it logs (warn/error level). */
  private attachExceptionForLog(
    exception: unknown,
    request: RequestWithNestException,
    status: number
  ): void {
    const isError = exception instanceof Error
    const isClientError = status in STATUS_BODY_MAP && status < 500
    request.__nestException = {
      name: isError ? exception.name : 'Error',
      message: isError ? exception.message : 'Unhandled exception',
      ...(isClientError
        ? {}
        : { stack: isError ? exception.stack : undefined }),
    }
  }
}
