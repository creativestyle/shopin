import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import {
  port,
  type Credentials,
  type Port,
  type SignedIn,
} from '@core/integration-kit'
import { MOCK_IDENTITY_PASSWORD, MOCK_IDENTITY_USERS } from './fixtures'

/** Identities and their passwords by e-mail, kept apart so an identity never carries a password. */
const users = new Map<string, SignedIn>(
  MOCK_IDENTITY_USERS.map((u) => [u.email, { ...u }])
)
const passwords = new Map<string, string>(
  MOCK_IDENTITY_USERS.map((u) => [u.email, MOCK_IDENTITY_PASSWORD])
)

/** Identity only: returns who signed in, knows nothing about customers, carts or orders. */
@Injectable()
export class MockIdentityProvider implements Port<'auth'> {
  async signIn({ email, password }: Credentials) {
    const key = email.toLowerCase()
    const identity = users.get(key)
    if (!identity || passwords.get(key) !== password) {
      throw new UnauthorizedException('Invalid email or password')
    }
    return { identity: { ...identity } }
  }

  async signUp(
    request: Parameters<Port<'auth'>['signUp']>[0]
  ): Promise<{ identity: SignedIn }> {
    const email = request.email.toLowerCase()
    if (users.has(email)) {
      throw new ConflictException('An account with this e-mail exists')
    }
    const identity: SignedIn = {
      subject: `mock-idp|${email}`,
      email,
      // a real IdP would send a verification mail; the mock verifies at once
      emailVerified: true,
      name:
        [request.firstName, request.lastName].filter(Boolean).join(' ') ||
        email,
    }
    users.set(email, identity)
    passwords.set(email, request.password)
    return { identity: { ...identity } }
  }

  async signOut(): Promise<void> {}

  async refresh(identity: SignedIn): Promise<SignedIn> {
    const user = users.get(identity.email.toLowerCase())
    if (!user || user.subject !== identity.subject) {
      throw new UnauthorizedException('Identity no longer exists')
    }
    return { ...user }
  }
}

export default port('auth', {
  providers: [MockIdentityProvider],
  inject: [MockIdentityProvider],
  useFactory: (identity: MockIdentityProvider) => identity,
})
