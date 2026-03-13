import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  Optional,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ACCESS_TOKEN_TOKEN } from '@config/constants'
import type {
  LoginRequest,
  LoginResponse,
  TokenFields,
} from '@core/contracts/auth/login'
import { createCustomerScope } from '../scopes'
import { CommercetoolsErrorMatcher } from '../utils/commercetools-error-matcher'
import { OAuthTokenService } from './oauth-token.service'
import type { TokenProvider } from '@apps/bff/src/common/token-management/token-provider'
import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk'
import { ClientBuilder } from '@commercetools/ts-client'
import { ServerClientService } from '@integrations/commercetools-api'

@Injectable()
export class CommercetoolsLoginService {
  constructor(
    private readonly oauthTokenService: OAuthTokenService,
    private readonly errorMatcher: CommercetoolsErrorMatcher,
    private readonly configService: ConfigService,
    private readonly serverClientService: ServerClientService,
    @Optional()
    @Inject(ACCESS_TOKEN_TOKEN)
    private readonly accessTokenProvider?: TokenProvider
  ) {}

  async login(
    loginRequest: LoginRequest
  ): Promise<LoginResponse & TokenFields> {
    try {
      await this.checkEmailVerification(loginRequest.email)

      const projectKey = this.oauthTokenService.getProjectKey()
      await this.mergeAnonymousCart(loginRequest, projectKey)

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
            where: `email="${email}"`,
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
   * Merges anonymous cart with customer cart if anonymous session exists.
   */
  private async mergeAnonymousCart(
    loginRequest: LoginRequest,
    projectKey: string
  ): Promise<void> {
    const anonymousSessionToken = this.accessTokenProvider
      ? await this.accessTokenProvider.getAccessToken()
      : undefined

    if (!anonymousSessionToken) {
      return
    }

    const apiUrl = this.configService.getOrThrow<string>(
      'COMMERCETOOLS_API_URL'
    )

    const client = new ClientBuilder()
      .withExistingTokenFlow(`Bearer ${anonymousSessionToken}`, {
        force: true,
      })
      .withHttpMiddleware({
        host: apiUrl,
      })
      .build()

    const apiClient = createApiBuilderFromCtpClient(client).withProjectKey({
      projectKey,
    })

    await apiClient
      .me()
      .login()
      .post({
        body: {
          email: loginRequest.email,
          password: loginRequest.password,
        },
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
