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
    // a platform's errors reach here as Nest exceptions: the BFF translates them where it calls a port
    // (data-source/port-errors.ts). Anything else is a bug: 500.
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR
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
