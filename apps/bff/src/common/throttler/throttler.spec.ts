/**
 * The rate limiter: the "secure" limit applies only to @SecureRateLimit() routes, chosen per request (requests run
 * concurrently), and behind a proxy the limiter
 * counts the client's address (BFF_TRUST_PROXY).
 */
// the auth controller's module graph without a shop config
jest.mock('../../data-source/ports.module', () => ({
  Ports: class {},
  Services: class {},
}))

import { Reflector } from '@nestjs/core'
import type { ExecutionContext } from '@nestjs/common'
import express from 'express'
import { SecureRateLimit } from './secure-rate-limit.decorator'
import { OptionalThrottlerGuard } from './throttler'
import { trustProxy } from './trust-proxy'

class Routes {
  open() {}
  @SecureRateLimit()
  secure() {}
}

/** A guard with both limiters at one request per minute; `increments` records which limiter counted what. */
async function guard() {
  const increments: string[] = []
  const hits = new Map<string, number>()
  const storage = {
    async increment(
      key: string,
      ttl: number,
      limit: number,
      _b: number,
      name: string
    ) {
      // a storage round trip: another request runs meanwhile
      await new Promise((r) => setImmediate(r))
      const totalHits = (hits.get(key) ?? 0) + 1
      hits.set(key, totalHits)
      increments.push(name)
      return {
        totalHits,
        timeToExpire: ttl,
        isBlocked: totalHits > limit,
        timeToBlockExpire: totalHits > limit ? ttl : 0,
      }
    },
  }
  const g = new OptionalThrottlerGuard(
    {
      throttlers: [
        { name: 'default', ttl: 60000, limit: 1 },
        { name: 'secure', ttl: 60000, limit: 1 },
      ],
    },
    storage as never,
    new Reflector(),
    { get: () => 'true' } as never
  )
  await g.onModuleInit()
  return { g, increments }
}

function context(
  classRef: object,
  handler: (...args: never[]) => unknown,
  ip = '198.51.100.1'
): ExecutionContext {
  const req = { ip, headers: {} }
  const res = { header() {} }
  return {
    getHandler: () => handler,
    getClass: () => classRef,
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ExecutionContext
}

describe('rate limiting', () => {
  it('applies the secure limit to a secure route even while another request is being checked', async () => {
    const { g, increments } = await guard()
    const open = context(Routes, Routes.prototype.open, '198.51.100.1')
    const secure = context(Routes, Routes.prototype.secure, '198.51.100.2')
    await Promise.all([g.canActivate(open), g.canActivate(secure)])
    // the open route counts against the default limit only; the secure one against the secure limit only
    expect(increments.sort()).toEqual(['default', 'secure'])
    await expect(g.canActivate(secure)).rejects.toThrow(/Too Many Requests/i)
  })
})

describe('BFF_TRUST_PROXY', () => {
  /** req.ip as Express computes it for a request from `peer` that carries X-Forwarded-For. */
  function ipBehind(
    env: Record<string, string>,
    peer: string,
    forwarded: string
  ) {
    const app = express()
    const trust = trustProxy(env)
    if (trust !== undefined) {
      app.set('trust proxy', trust)
    }
    const req = Object.create(app.request) as express.Request
    Object.assign(req, {
      app,
      headers: { 'x-forwarded-for': forwarded },
      socket: { remoteAddress: peer },
      connection: { remoteAddress: peer },
    })
    return req.ip
  }

  it('is off by default: a forwarded address is not believed', () => {
    expect(ipBehind({}, '10.0.0.5', '203.0.113.9')).toBe('10.0.0.5')
    expect(
      ipBehind({ BFF_TRUST_PROXY: 'false' }, '10.0.0.5', '203.0.113.9')
    ).toBe('10.0.0.5')
  })

  it('behind one proxy the limiter counts the client address, not the proxy', () => {
    expect(ipBehind({ BFF_TRUST_PROXY: '1' }, '10.0.0.5', '203.0.113.9')).toBe(
      '203.0.113.9'
    )
    // a client's own forged entry is skipped: only the hop the proxy appended counts
    expect(
      ipBehind({ BFF_TRUST_PROXY: '1' }, '10.0.0.5', '6.6.6.6, 203.0.113.9')
    ).toBe('203.0.113.9')
    expect(
      ipBehind({ BFF_TRUST_PROXY: '10.0.0.0/8' }, '10.0.0.5', '203.0.113.9')
    ).toBe('203.0.113.9')
  })
})
