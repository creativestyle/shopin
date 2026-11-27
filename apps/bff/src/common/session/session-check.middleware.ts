import { Injectable, type NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import {
  DEFAULT_COOKIE_PATH,
  DEFAULT_COOKIE_SAME_SITE,
} from '@config/constants'
import { Ports } from '../../data-source/ports.module'
import {
  currentProviders,
  isOwnSignIn,
  keyOf,
} from '../../data-source/providers'
import { TokenEncryptionService } from '../token-management/token-encryption.service'
import { VaultService } from '../vault/vault.service'
import {
  readSession,
  sealSession,
  SESSION_COOKIE,
  SESSION_IDLE_MS,
  SESSION_RECHECK_MS,
  SESSION_REFRESH_GRACE_MS,
  setRequestSession,
} from './session.service'

/** How long one re-check may take before it counts as the provider being unreachable. */
const REFRESH_TIMEOUT_MS = 5000

/** The provider refused the identity (a 4xx it stands behind: gone, invalid), as opposed to an outage. */
class Refused extends Error {}

/**
 * A port's error that says the identity no longer holds. An HTTP exception the port throws itself (Unauthorized,
 * NotFound, Forbidden: any 4xx but a timeout or rate limit) is the port standing behind it. A vendor SDK's raw error
 * counts only as 404 or 410 (the customer is gone): its 401 or 403 is about the BFF's own API client (a rotated
 * secret, a missing scope), an outage to wait out, never a reason to sign every shopper out.
 */
function isRefusal(error: unknown): boolean {
  const e = error as {
    getStatus?: () => number
    statusCode?: number
    status?: number
  }
  if (typeof e?.getStatus === 'function') {
    const status = e.getStatus()
    return status >= 400 && status < 500 && status !== 408 && status !== 429
  }
  const status = e?.statusCode ?? e?.status
  return status === 404 || status === 410
}

/**
 * Before any handler: a signed-in session whose identity was last confirmed more than SESSION_RECHECK_MS
 * ago is re-checked with the identity provider that issued it (`refresh`). Confirmed → the session is
 * re-issued (sliding idle lifetime). Refused (a 4xx from the port, another subject, or that provider no
 * longer serves sign-in) → the shopper is signed out at once. Unreachable (network error, 5xx, timeout) →
 * the shopper stays signed in and the next request tries again, until SESSION_REFRESH_GRACE_MS after the
 * last confirmation; so is a sign-in provider marked unavailable (its credentials check failed at start).
 * Revoked and expired sessions already read as signed out (readSession).
 */
@Injectable()
export class SessionCheckMiddleware implements NestMiddleware {
  constructor(
    private readonly ports: Ports,
    private readonly encryption: TokenEncryptionService
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.cookies?.[SESSION_COOKIE]) {
        await this.check(req, res)
      }
      next()
    } catch (error) {
      next(error)
    }
  }

  private async check(req: Request, res: Response): Promise<void> {
    const state = await readSession(req, this.encryption)
    // unreadable, expired or revoked reads as {}: SessionService clears it; a guest has nothing to check
    if (!state.links || !state.identity) {
      return
    }
    // the commerce platform's own sign-in: the customer's commerce token is what signs them in there. Without it
    // (a dead refresh token, an entry the vault no longer trusts) the session ends too, instead of a shopper who
    // looks signed in while every account call fails
    if (isOwnSignIn()) {
      const commerce = keyOf(currentProviders().providers.commerce!)
      if (state.links[commerce]) {
        const entry = await VaultService.forRequest(req, this.encryption).entry(
          'commerce',
          commerce
        )
        if (!entry?.customer) {
          this.signOut(req, res)
          return
        }
      }
    }
    if (Date.now() - (state.checkedAt ?? 0) < SESSION_RECHECK_MS) {
      return
    }
    const { identity } = state
    const auth = this.ports.auth
    try {
      if (currentProviders().unavailable.auth) {
        // sign-in is configured but cannot serve (its credentials check failed): an outage, not a refusal, so the
        // grace keeps the session instead of signing every shopper out
        throw new Error('the identity provider is unavailable')
      }
      if (
        !auth ||
        keyOf(currentProviders().providers.auth!) !== identity.provider
      ) {
        throw new Refused(
          'the identity provider of this session does not serve sign-in'
        )
      }
      const fresh = await withTimeout(auth.refresh(identity))
      if (fresh.subject !== identity.subject) {
        throw new Refused('the identity provider returned another subject')
      }
      const next = {
        ...state,
        links: state.links,
        identity: { ...fresh, provider: identity.provider },
        checkedAt: Date.now(),
      }
      setRequestSession(req, next)
      res.cookie(SESSION_COOKIE, await sealSession(next, this.encryption), {
        httpOnly: true,
        secure: true,
        sameSite: DEFAULT_COOKIE_SAME_SITE,
        maxAge: SESSION_IDLE_MS,
        path: DEFAULT_COOKIE_PATH,
      })
    } catch (error) {
      const outage = !(error instanceof Refused) && !isRefusal(error)
      if (
        outage &&
        Date.now() - (state.checkedAt ?? 0) < SESSION_REFRESH_GRACE_MS
      ) {
        // unreachable for now: keep the session as it is (not re-issued), the next request tries again
        return
      }
      this.signOut(req, res)
    }
  }

  private signOut(req: Request, res: Response): void {
    setRequestSession(req, { links: {} })
    res.clearCookie(SESSION_COOKIE, { path: DEFAULT_COOKIE_PATH })
  }
}

/** The re-check, or an error once REFRESH_TIMEOUT_MS passes (an unreachable provider, not a refusal). */
function withTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error('the identity provider did not answer in time')),
      REFRESH_TIMEOUT_MS
    )
    timer.unref?.()
  })
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer))
}
