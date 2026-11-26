import { AsyncLocalStorage } from 'node:async_hooks'
import type { NextFunction, Request, Response } from 'express'

/** The request in progress, for the core's singleton request accessors (RequestContext, TokenVault, CustomerContext). */
export interface RequestStore {
  req: Request & { language?: string; providers?: unknown }
}

const store = new AsyncLocalStorage<RequestStore>()

export function currentRequest(): RequestStore['req'] {
  const s = store.getStore()
  if (!s) {
    throw new Error(
      'No request in progress: request accessors are called while serving a request'
    )
  }
  return s.req
}

/** Runs `fn` as part of serving `req` (the middleware does this for HTTP requests; tests call it directly). */
export function runInRequest<T>(req: object, fn: () => T): T {
  return store.run({ req: req as RequestStore['req'] }, fn)
}

export function requestStoreMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  runInRequest(req, next)
}
