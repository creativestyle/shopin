import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import type { Request } from 'express'
import type { ZodError } from 'zod'
import type { NestExceptionForLog } from '../logger/logger.config'
import { FrontendInputValidationException } from '../validation/frontend-input-validation.exception'

type ErrorBody =
  | { statusCode: 400; message: string; issues: ZodError['issues'] }
  | { statusCode: 401; message: string }
  | { statusCode: 403; message: string }
  | { statusCode: 404; message: string }
  | { statusCode: 409; message: string }
  | { statusCode: 429; message: string }
  | { statusCode: 500; message: string }

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
    return HttpStatus.INTERNAL_SERVER_ERROR
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

    return STATUS_BODY_MAP[status] ?? DEFAULT_ERROR_BODY
  }

  /** Attach exception to request so pino-http can include it when it logs (warn/error level). */
  private attachExceptionForLog(
    exception: unknown,
    request: RequestWithNestException,
    status: number
  ): void {
    const isError = exception instanceof Error
    const isClientError = status in STATUS_BODY_MAP
    request.__nestException = {
      name: isError ? exception.name : 'Error',
      message: isError ? exception.message : 'Unhandled exception',
      ...(isClientError
        ? {}
        : { stack: isError ? exception.stack : undefined }),
    }
  }
}
