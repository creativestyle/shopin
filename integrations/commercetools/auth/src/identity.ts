import { Injectable, UnauthorizedException } from '@nestjs/common'
import type { Credentials, Port, SignedIn } from '@core/integration-kit'
import type { Customer } from '@commercetools/platform-sdk'
import { ServerClientService } from '@integrations/commercetools-core'
import { UserClientService } from '@integrations/commercetools-core'
import { quoted } from '@integrations/commercetools-core'
import { CommercetoolsLoginService } from './services/login.service'
import { CommercetoolsRegisterService } from './services/register.service'
import { CommercetoolsLogoutService } from './services/logout.service'

/**
 * commercetools' own sign-in as one identity provider among others: the subject is the commercetools
 * customer id, and the customer token is handed back as the commerce session (server-side only).
 */
@Injectable()
export class CommercetoolsIdentityProvider implements Omit<
  Port<'auth'>,
  'accountFlows'
> {
  constructor(
    private readonly login: CommercetoolsLoginService,
    private readonly register: CommercetoolsRegisterService,
    private readonly logout: CommercetoolsLogoutService,
    private readonly server: ServerClientService,
    private readonly user: UserClientService
  ) {}

  private toIdentity(c: Customer): SignedIn {
    return {
      subject: c.id,
      email: c.email,
      emailVerified: c.isEmailVerified !== false,
      name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email,
    }
  }

  /** Only after a sign-up (no customer token yet): the new customer by e-mail. */
  private async byEmail(email: string): Promise<SignedIn> {
    const { body } = await this.server
      .getClient()
      .customers()
      .get({
        queryArgs: {
          where: `lowercaseEmail=${quoted(email.toLowerCase())}`,
          limit: 1,
        },
      })
      .execute()
    const c = body.results[0]
    if (!c) {
      throw new UnauthorizedException('Invalid email or password')
    }
    return this.toIdentity(c)
  }

  /** The identity is the customer the password flow authenticated: `me()` with the token it returned. */
  async signIn(
    credentials: Credentials,
    guest?: Parameters<Port<'auth'>['signIn']>[1]
  ): ReturnType<Port<'auth'>['signIn']> {
    const r = await this.login.login(credentials, guest?.commerceAccessToken)
    const { body } = await this.user
      .forToken(r.accessToken)
      .me()
      .get()
      .execute()
    return {
      identity: this.toIdentity(body),
      commerceSession: {
        accessToken: r.accessToken,
        refreshToken: r.refreshToken,
        expiresIn: r.expiresIn,
      },
    }
  }

  async signUp(
    request: Parameters<Port<'auth'>['signUp']>[0]
  ): Promise<{ identity: SignedIn }> {
    await this.register.register({
      email: request.email,
      password: request.password,
      firstName: request.firstName ?? '',
      lastName: request.lastName ?? '',
    } as never)
    return { identity: await this.byEmail(request.email) }
  }

  async signOut(
    _identity: SignedIn,
    session?: { accessToken?: string; refreshToken?: string }
  ): Promise<void> {
    await this.logout.logout({
      accessToken: session?.accessToken,
      refreshToken: session?.refreshToken,
    })
  }

  /** Re-reads the same customer (the subject is its id), never another one with the same e-mail. */
  async refresh(identity: SignedIn): Promise<SignedIn> {
    const { body } = await this.server
      .getClient()
      .customers()
      .withId({ ID: identity.subject })
      .get()
      .execute()
    return this.toIdentity(body)
  }
}
