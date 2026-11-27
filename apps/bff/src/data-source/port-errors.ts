import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GatewayTimeoutException,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import type { PortError } from '@core/integration-kit'

/** The fixed message per status when the integration gives none: never the platform's own text. */
const EXCEPTIONS: Record<
  PortError['status'],
  (message?: string) => HttpException
> = {
  400: (m) => new BadRequestException(m ?? 'The request cannot be served'),
  401: (m) => new UnauthorizedException(m ?? 'Authentication failed'),
  403: (m) => new ForbiddenException(m ?? 'Not allowed'),
  404: (m) => new NotFoundException(m ?? 'Not found'),
  409: (m) => new ConflictException(m ?? 'Changed meanwhile, try again'),
  502: (m) => new BadGatewayException(m ?? 'The platform failed'),
  503: (m) =>
    new ServiceUnavailableException(m ?? 'The platform is unavailable'),
  504: (m) =>
    new GatewayTimeoutException(m ?? 'The platform did not answer in time'),
}

/**
 * A network failure, vendor-neutral: Node's and undici's error codes, and fetch's timeout or abort, also as the
 * `cause` of the SDK's own error (fetch wraps the network error). The platform cannot be reached (503) or did not
 * answer in time (504).
 */
const NETWORK_CODES: Record<string, 503 | 504> = {
  ECONNREFUSED: 503,
  ECONNRESET: 503,
  ENOTFOUND: 503,
  EAI_AGAIN: 503,
  EHOSTUNREACH: 503,
  ETIMEDOUT: 504,
  ECONNABORTED: 504,
  UND_ERR_CONNECT_TIMEOUT: 504,
}
const FETCH_ABORTS: Record<string, 504> = { TimeoutError: 504, AbortError: 504 }

export function networkFailure(error: unknown): PortError | undefined {
  let e = error
  for (let depth = 0; depth < 4 && e && typeof e === 'object'; depth++) {
    const { code, name, cause } = e as {
      code?: unknown
      name?: unknown
      cause?: unknown
    }
    const status =
      (typeof code === 'string' ? NETWORK_CODES[code] : undefined) ??
      (typeof name === 'string' ? FETCH_ABORTS[name] : undefined)
    if (status) {
      return { status }
    }
    e = cause
  }
  return undefined
}

/** Platform failures: the only meanings the sign-in flows get translated (they read their 4xx raw). */
const PLATFORM_FAILURE = new Set<PortError['status']>([502, 503, 504])

/** Members whose 4xx errors the session check and the token refresh read raw (`invalid_grant`, 404, 410). */
const SIGN_IN_MEMBERS = new Set(['guestSession', 'customers'])

/**
 * The port as the BFF serves it: a thrown error passes through the integration's `errors` translator, then the
 * vendor-neutral network check, and a meaning becomes the matching Nest exception (the platform's error kept as
 * `cause`); anything else is thrown as it was. Every method of the services (`…Service` members) and the port's
 * other methods get all meanings. The sign-in flows (the `auth` port with its `accountFlows`, and the
 * `guestSession` and `customers` members) get only platform failures (502–504): their 4xx stay raw for the code
 * that reads them. So the BFF's error filter sees Nest exceptions only, never a vendor's error shape.
 */
export function withPortErrors<P>(
  port: P,
  category: string,
  errors: ((error: unknown) => PortError | undefined) | undefined
): P {
  if (!port || typeof port !== 'object') {
    return port
  }
  const translator =
    (signIn: boolean) =>
    (error: unknown): unknown => {
      if (error instanceof HttpException) {
        return error
      }
      const meaning = errors?.(error) ?? networkFailure(error)
      if (!meaning || (signIn && !PLATFORM_FAILURE.has(meaning.status))) {
        return error
      }
      const make = EXCEPTIONS[meaning.status]
      if (!make) {
        return error
      }
      const exception = make(meaning.message)
      ;(exception as { cause?: unknown }).cause = error
      return exception
    }
  const all = translator(false)
  const failures = translator(true)
  const call =
    (
      target: object,
      fn: (...a: unknown[]) => unknown,
      translate: (error: unknown) => unknown
    ) =>
    (...args: unknown[]) => {
      try {
        const out = fn.apply(target, args)
        return out instanceof Promise
          ? out.catch((error: unknown) => {
              throw translate(error)
            })
          : out
      } catch (error) {
        throw translate(error)
      }
    }
  const service = (s: object, translate: (error: unknown) => unknown) =>
    new Proxy(s, {
      get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver)
        return typeof value === 'function'
          ? call(target, value, translate)
          : value
      },
    })
  const isObject = (v: unknown): v is object => !!v && typeof v === 'object'
  const signIn = category === 'auth'
  const wrap = (key: string, value: unknown): unknown => {
    const translate = signIn || SIGN_IN_MEMBERS.has(key) ? failures : all
    if (typeof value === 'function') {
      return call(
        port as object,
        value as (...a: unknown[]) => unknown,
        translate
      )
    }
    if (signIn && key === 'accountFlows' && isObject(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([name, flow]) => [
          name,
          isObject(flow) ? service(flow, translate) : flow,
        ])
      )
    }
    return isObject(value) &&
      (key.endsWith('Service') || SIGN_IN_MEMBERS.has(key))
      ? service(value, translate)
      : value
  }
  // lazy: a port that serves through others has getters bound to the request in progress, and there is none at boot
  return new Proxy(port as object, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver)
      return typeof key === 'string' && key !== 'then'
        ? wrap(key, value)
        : value
    },
  }) as P
}
