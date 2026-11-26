import { Injectable, NotImplementedException } from '@nestjs/common'
import type { AllAuthServices } from '@core/contracts/core/data-source-interfaces'
import type { SessionTokens, SignedIn } from '@core/integration-kit'
import type { LoginRequest, LoginResponse } from '@core/contracts/auth/login'
import type {
  RegisterRequest,
  RegisterResponse,
} from '@core/contracts/auth/register'
import type {
  ConfirmEmailRequest,
  ConfirmEmailResponse,
} from '@core/contracts/auth/confirm-email'
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from '@core/contracts/auth/forgot-password'
import type {
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@core/contracts/auth/reset-password'
import type {
  ResendVerificationEmailRequest,
  ResendVerificationEmailResponse,
} from '@core/contracts/auth/resend-verification-email'
import { Ports } from '../../data-source/ports.module'
import { currentProviders, keyOf } from '../../data-source/providers'
import { TokenStorageService } from '../../common/token-management/token-storage.service'
import { CartIdService } from '../cart-id/cart-id.service'
import { WishlistIdService } from '../wishlist-id/wishlist-id.service'
import {
  identityKey,
  revocations,
  SessionService,
} from '../../common/session/session.service'
import { VaultService } from '../../common/vault/vault.service'
import { linkCustomer } from './customer-link'
import type { Identity } from '../../common/session/session.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly ports: Ports,
    private readonly tokenStorageService: TokenStorageService,
    private readonly cartIdService: CartIdService,
    private readonly wishlistIdService: WishlistIdService,
    private readonly session: SessionService,
    private readonly vault: VaultService
  ) {}

  /** The auth port: this module is mounted only when an auth provider is configured. */
  private get auth() {
    return this.ports.auth!
  }

  /** Account flows (register, confirm e-mail, password reset) the identity provider offers. */
  private flow<K extends keyof AllAuthServices>(name: K): AllAuthServices[K] {
    const flow = this.auth.accountFlows?.[name]
    if (!flow) {
      throw new NotImplementedException(
        `The identity provider does not offer ${name}`
      )
    }
    return flow as AllAuthServices[K]
  }

  /**
   * The neutral sign-in sequence: identity from the auth part → link through the commerce part →
   * new SHOPin session value (identity + link) → the commerce part's own session, when the identity
   * provider is that platform's own sign-in. The guest-cart step runs in the controller afterwards.
   */
  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const { identity, commerceSession } = await this.auth.signIn(
      loginRequest,
      await this.guestSessionForNativeSignIn()
    )
    await this.completeSignIn(identity, commerceSession)
    return { success: true }
  }

  /**
   * The guest's commerce session, only when the identity provider is the commerce platform's own sign-in: that
   * platform takes the guest cart over at sign-in (commercetools merges it). Never handed to another provider.
   */
  private async guestSessionForNativeSignIn(): Promise<
    { commerceAccessToken: string } | undefined
  > {
    const { providers } = currentProviders()
    if (providers.auth !== providers.commerce) {
      return undefined
    }
    if ((await this.tokenStorageService.getAuthStatus()) !== false) {
      return undefined
    }
    const accessToken = await this.tokenStorageService.getAccessToken()
    return accessToken ? { commerceAccessToken: accessToken } : undefined
  }

  /** After the identity provider said who signed in (password or redirect sign-in). */
  private async completeSignIn(
    signedIn: SignedIn,
    commerceSession?: SessionTokens
  ): Promise<void> {
    const { providers } = currentProviders()
    // the BFF names the provider: the integration serving auth for this request, never the part's word
    const identity: Identity = {
      ...signedIn,
      provider: keyOf(providers.auth!),
    }
    const native = providers.auth === providers.commerce
    const customerId = await linkCustomer(
      identity,
      this.ports.commerce.customers,
      { native }
    )
    await this.session.signIn(identity, customerId!)
    if (commerceSession) {
      await this.tokenStorageService.setTokens(
        commerceSession,
        true,
        customerId!
      )
    }
  }

  /**
   * After sign-in and the guest-cart takeover: a signed-in shopper never keeps the guest's commerce token.
   * Either the identity provider handed the customer's commerce session (a customer entry, kept), or the
   * commerce part acts for the linked customer without one (the guest entry is dropped).
   */
  async dropGuestSession(): Promise<void> {
    if ((await this.tokenStorageService.getAuthStatus()) === false) {
      this.tokenStorageService.clearTokens()
    }
  }

  /**
   * A platform's own register flow when it offers one (it keeps salutation and birth date), otherwise the
   * port's `signUp`: an identity provider without account flows (the mock) verifies at once and needs no token.
   */
  async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
    if (!this.auth.accountFlows?.registerService) {
      await this.auth.signUp(registerRequest)
      return { success: true }
    }
    const registerResult =
      await this.flow('registerService').register(registerRequest)

    // TODO: temporary solution to return email token to frontend, it should send email.
    if (registerResult.success) {
      const tokenResult = await this.flow(
        'generateEmailTokenService'
      ).generateEmailToken({
        email: registerRequest.email,
      })
      return { ...registerResult, emailToken: tokenResult.emailToken }
    }

    return registerResult
  }

  /** Clears the session and every vault entry locally first, then asks the auth part to revoke. */
  async logout(): Promise<void> {
    const identity = await this.session.identity()
    // the commerce tokens go to the identity provider only when it issued them (the platform's own
    // sign-in returned them as commerceSession, so the vault entry is a customer entry); never to another
    const customerEntry =
      (await this.tokenStorageService.getAuthStatus()) === true
    const tokens = customerEntry
      ? await this.tokenStorageService.getTokens()
      : undefined
    this.session.signOut()
    this.vault.clearAll()
    await this.cartIdService.deleteAllCartIds()
    await this.wishlistIdService.deleteAllWishlistIds()
    if (!identity) {
      return
    }
    try {
      await this.auth.signOut(identity, tokens)
    } catch {
      // the auth provider may be down: the shopper is signed out here regardless
    }
  }

  async confirmEmail(
    confirmEmailRequest: ConfirmEmailRequest
  ): Promise<ConfirmEmailResponse> {
    return await this.flow('confirmEmailService').confirmEmail(
      confirmEmailRequest
    )
  }

  async forgotPassword(
    forgotPasswordRequest: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    const result = await this.flow('forgotPasswordService').forgotPassword(
      forgotPasswordRequest
    )
    // Always return success to prevent email enumeration — callers cannot
    // distinguish whether the email exists or not from the API response.
    // TODO: remove passwordResetToken once email service is configured.
    return { success: true, passwordResetToken: result.passwordResetToken }
  }

  async resetPassword(
    resetPasswordRequest: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    const { subject, ...result } = await this.flow(
      'resetPasswordService'
    ).resetPassword(resetPasswordRequest)
    // every session of that identity, issued before now, stops working (it may be the attacker's)
    if (result.success && subject) {
      revocations.revokeIdentity(
        identityKey({
          provider: keyOf(currentProviders().providers.auth!),
          subject,
        }),
        Date.now()
      )
    }
    return result
  }

  async resendVerificationEmail(
    request: ResendVerificationEmailRequest
  ): Promise<ResendVerificationEmailResponse> {
    const result = await this.flow(
      'generateEmailTokenService'
    ).generateEmailToken({
      email: request.email,
    })
    // Always return success to prevent email enumeration.
    // TODO: remove emailToken once email service is configured.
    return { success: true, emailToken: result.emailToken }
  }
}
