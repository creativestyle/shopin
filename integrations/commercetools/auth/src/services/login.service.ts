import { PortOptions } from '@core/integration-kit'
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common'
import type {
  LoginRequest,
  LoginResponse,
  TokenFields,
} from '@core/contracts/auth/login'
import { createCustomerScope } from '@integrations/commercetools-core'
import { CommercetoolsErrorMatcher } from '../utils/commercetools-error-matcher'
import { OAuthTokenService } from '@integrations/commercetools-core'
import { ServerClientService } from '@integrations/commercetools-core'
import { UserClientService } from '@integrations/commercetools-core'
import type { CommercetoolsOptions } from '@integrations/commercetools-core'
import { quoted } from '@integrations/commercetools-core'

@Injectable()
export class CommercetoolsLoginService {
  constructor(
    private readonly oauthTokenService: OAuthTokenService,
    private readonly errorMatcher: CommercetoolsErrorMatcher,
    @Inject(PortOptions) private readonly options: CommercetoolsOptions,
    private readonly serverClientService: ServerClientService,
    private readonly userClientService: UserClientService
  ) {}

  /** @param guestAccessToken - the shopper's anonymous token: its cart is merged into the customer's (as before the migration) */
  async login(
    loginRequest: LoginRequest,
    guestAccessToken?: string
  ): Promise<LoginResponse & TokenFields> {
    try {
      await this.checkEmailVerification(loginRequest.email)

      const projectKey = this.oauthTokenService.getProjectKey()
      if (guestAccessToken) {
        await this.mergeGuestCart(loginRequest, guestAccessToken)
      }

      const tokenData = await this.requestOAuthTokens(loginRequest, projectKey)

      return {
        success: true,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresIn: tokenData.expiresIn,
      }
    } catch (error: unknown) {
      if (this.errorMatcher.isInvalidCredentialsError(error)) {
        throw new UnauthorizedException('Invalid email or password')
      }
      throw error
    }
  }

  /**
   * Checks if the customer's email is verified before allowing login.
   * Only blocks login if isEmailVerified is explicitly false (not undefined/null).
   */
  private async checkEmailVerification(email: string): Promise<void> {
    try {
      const serverClient = this.serverClientService.getClient()
      const customersResponse = await serverClient
        .customers()
        .get({
          queryArgs: {
            where: `lowercaseEmail=${quoted(email.toLowerCase())}`,
            limit: 1,
          },
        })
        .execute()

      if (
        customersResponse.body.results?.length &&
        customersResponse.body.results[0]
      ) {
        const customer = customersResponse.body.results[0]
        // Explicitly check for false - undefined/null means verification status is unknown, allow login
        if (customer.isEmailVerified === false) {
          throw new ForbiddenException(
            'Please verify your email address before logging in'
          )
        }
      }
    } catch (error) {
      // If email is not verified, re-throw the error to be handled by outer catch
      if (error instanceof ForbiddenException) {
        throw error
      }
      // For other errors (like customer not found or network issues), allow login to proceed
      // Customer fetch might fail for various reasons, don't block login in those cases
    }
  }

  /**
   * commercetools' sign-in with the guest's anonymous token: the anonymous cart becomes the customer's (merged into
   * the customer's active cart when there is one). Wrong credentials fail here, before any token is issued.
   */
  private async mergeGuestCart(
    loginRequest: LoginRequest,
    guestAccessToken: string
  ): Promise<void> {
    await this.userClientService
      .forToken(guestAccessToken)
      .me()
      .login()
      .post({
        body: { email: loginRequest.email, password: loginRequest.password },
      })
      .execute()
  }

  /**
   * Requests OAuth tokens via password flow.
   */
  private async requestOAuthTokens(
    loginRequest: LoginRequest,
    projectKey: string
  ) {
    return await this.oauthTokenService.requestToken({
      grantType: 'password',
      endpoint: `oauth/${projectKey}/customers/token`,
      formData: {
        username: loginRequest.email,
        password: loginRequest.password,
        scope: createCustomerScope(projectKey),
      },
    })
  }
}
