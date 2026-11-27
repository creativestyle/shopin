/**
 * The CSRF check on the shop's own state-changing routes: reads pass, a write needs a matching token, and a request
 * without a method is refused (never read as a GET, which would skip the check).
 */
import { randomBytes } from 'node:crypto'
import { ForbiddenException } from '@nestjs/common'
import { CSRF_TOKEN_HEADER_NAME } from '@config/constants'
import { loadEnvFile } from '../../common/env/env-file'
import { CsrfOnWritesGuard } from './csrf.guard'
import { CsrfTokenEncryptionService } from './csrf-token-encryption.service'
import { CsrfTokenService } from './csrf-token.service'

const key = () => randomBytes(32).toString('base64')
Object.assign(process.env, {
  SHOPIN_IGNORE_ENV_FILE: '1',
  CSRF_TOKEN_ENCRYPTION_KEY: key(),
  CSRF_TOKEN_SIGNING_KEY: key(),
})
loadEnvFile()
const logger = { setContext() {}, error() {}, warn() {}, debug() {} }
const encryption = new CsrfTokenEncryptionService(logger as never)

function guard(valid: boolean) {
  const tokens = {
    getTokenFromHeader: () => (valid ? 'tok' : undefined),
    getTokenFromCookie: () => 'tok',
    validateTokens: jest.fn(async (h?: string, c?: string) => !!h && h === c),
  }
  const moduleRef = {
    registerRequestByContextId: jest.fn(),
    resolve: jest.fn(async () => tokens),
  }
  return { g: new CsrfOnWritesGuard(moduleRef as never), tokens }
}
const ctx = (method?: string) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ method }) }),
  }) as never

describe('CsrfOnWritesGuard', () => {
  it('a read (GET, HEAD, OPTIONS) passes without a token', async () => {
    const { g, tokens } = guard(false)
    for (const m of ['GET', 'HEAD', 'OPTIONS', 'get']) {
      await expect(g.canActivate(ctx(m))).resolves.toBe(true)
    }
    expect(tokens.validateTokens).not.toHaveBeenCalled()
  })

  it('a write without a matching token is refused (403)', async () => {
    const { g } = guard(false)
    await expect(g.canActivate(ctx('POST'))).rejects.toBeInstanceOf(
      ForbiddenException
    )
  })

  it('a write with a matching token passes', async () => {
    const { g } = guard(true)
    await expect(g.canActivate(ctx('PUT'))).resolves.toBe(true)
  })

  it('a request without a method is refused, not taken for a GET', async () => {
    const { g } = guard(true)
    await expect(g.canActivate(ctx(undefined))).rejects.toBeInstanceOf(
      ForbiddenException
    )
  })

  describe('with the real token service: the header token must be the cookie token', () => {
    /** The guard over a POST carrying `header` in the CSRF header and `cookie` in the CSRF cookie. */
    function write(header: string, cookie: string) {
      const request = {
        method: 'POST',
        headers: { [CSRF_TOKEN_HEADER_NAME.toLowerCase()]: header },
      }
      const tokens = new CsrfTokenService(
        { getCsrfToken: () => cookie } as never,
        encryption,
        request as never
      )
      const moduleRef = {
        registerRequestByContextId: jest.fn(),
        resolve: jest.fn(async () => tokens),
      }
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as never
      return new CsrfOnWritesGuard(moduleRef as never).canActivate(context)
    }

    it('the same token in header and cookie passes', async () => {
      const token = await new CsrfTokenService(
        {} as never,
        encryption,
        {} as never
      ).generateToken()
      await expect(write(token, token)).resolves.toBe(true)
    })

    it('a valid header token that is not the cookie token is refused (403)', async () => {
      const issue = () =>
        new CsrfTokenService(
          {} as never,
          encryption,
          {} as never
        ).generateToken()
      // both are tokens this BFF issued and signed: only their match is wrong (another tab's or session's token)
      const [mine, other] = await Promise.all([issue(), issue()])
      await expect(write(other, mine)).rejects.toBeInstanceOf(
        ForbiddenException
      )
    })

    it('equal tokens this BFF did not sign are refused (403)', async () => {
      await expect(write('forged', 'forged')).rejects.toBeInstanceOf(
        ForbiddenException
      )
    })
  })
})
