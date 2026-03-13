import { Injectable } from '@nestjs/common'
import type { LoginRequest, LoginResponse } from '@core/contracts/auth/login'
import type {
  RegisterRequest,
  RegisterResponse,
} from '@core/contracts/auth/register'
import type { LogoutRequest } from '@core/contracts/auth/logout'
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
import { DataSourceFactory } from '../../data-source/data-source.factory'
import { TokenStorageService } from '../../common/token-management/token-storage.service'
import { CartIdService } from '../cart-id/cart-id.service'
import { WishlistIdService } from '../wishlist-id/wishlist-id.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSourceFactory: DataSourceFactory,
    private readonly tokenStorageService: TokenStorageService,
    private readonly cartIdService: CartIdService,
    private readonly wishlistIdService: WishlistIdService
  ) {}

  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const { loginService } = this.dataSourceFactory.getAuthServices()
    const loginResult = await loginService.login(loginRequest)

    // Store access token and refresh token in HTTP-only cookies
    if (loginResult.accessToken && loginResult.refreshToken) {
      await this.tokenStorageService.setTokens(
        {
          accessToken: loginResult.accessToken,
          refreshToken: loginResult.refreshToken,
          expiresIn: loginResult.expiresIn,
        },
        true // User is authenticated (logged in)
      )
    }

    return {
      success: loginResult.success,
      statusCode: loginResult.statusCode,
    }
  }

  async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
    const { registerService } = this.dataSourceFactory.getAuthServices()
    const registerResult = await registerService.register(registerRequest)

    // TODO: temporary solution to return email token to frontend, it should send email.
    if (registerResult.success) {
      const { generateEmailTokenService } =
        this.dataSourceFactory.getAuthServices()
      const tokenResult = await generateEmailTokenService.generateEmailToken({
        email: registerRequest.email,
      })
      return { ...registerResult, emailToken: tokenResult.emailToken }
    }

    return registerResult
  }

  async logout(): Promise<void> {
    const { logoutService } = this.dataSourceFactory.getAuthServices()
    const tokens = await this.tokenStorageService.getTokens()
    const logoutRequest: LogoutRequest = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
    await logoutService.logout(logoutRequest)

    // Clear commercetools access and refresh token cookies
    this.tokenStorageService.clearTokens()

    // Delete all cart ID cookies
    await this.cartIdService.deleteAllCartIds()

    // Delete all wishlist ID cookies
    await this.wishlistIdService.deleteAllWishlistIds()
  }

  async confirmEmail(
    confirmEmailRequest: ConfirmEmailRequest
  ): Promise<ConfirmEmailResponse> {
    const { confirmEmailService } = this.dataSourceFactory.getAuthServices()
    return await confirmEmailService.confirmEmail(confirmEmailRequest)
  }

  async forgotPassword(
    forgotPasswordRequest: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    const { forgotPasswordService } = this.dataSourceFactory.getAuthServices()
    const result = await forgotPasswordService.forgotPassword(
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
    const { resetPasswordService } = this.dataSourceFactory.getAuthServices()
    return await resetPasswordService.resetPassword(resetPasswordRequest)
  }
}
