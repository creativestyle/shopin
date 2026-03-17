import {
  Controller,
  Post,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  HttpException,
} from '@nestjs/common'
import type { Request } from 'express'
import {
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger'
import { SecureRateLimit } from '../../common/throttler/secure-rate-limit.decorator'
import { AuthService } from './auth.service'
import { CartService } from '../cart/cart.service'
import { CartIdService } from '../cart-id/cart-id.service'
import { WishlistService } from '../wishlist/wishlist.service'
import { WishlistIdService } from '../wishlist-id/wishlist-id.service'
import {
  LoginRequestSchema,
  LoginResponseSchema,
  type LoginRequest,
  type LoginResponse,
} from '@core/contracts/auth/login'
import {
  RegisterRequestSchema,
  RegisterResponseSchema,
  type RegisterRequest,
  type RegisterResponse,
} from '@core/contracts/auth/register'
import {
  ConfirmEmailRequestSchema,
  ConfirmEmailResponseSchema,
  type ConfirmEmailRequest,
  type ConfirmEmailResponse,
} from '@core/contracts/auth/confirm-email'
import {
  ForgotPasswordRequestSchema,
  ForgotPasswordResponseSchema,
  type ForgotPasswordRequest,
  type ForgotPasswordResponse,
} from '@core/contracts/auth/forgot-password'
import {
  ResetPasswordRequestSchema,
  ResetPasswordResponseSchema,
  type ResetPasswordRequest,
  type ResetPasswordResponse,
} from '@core/contracts/auth/reset-password'
import {
  ResendVerificationEmailRequestSchema,
  ResendVerificationEmailResponseSchema,
  type ResendVerificationEmailRequest,
  type ResendVerificationEmailResponse,
} from '@core/contracts/auth/resend-verification-email'
import { ZodBody } from '../../common/validation'
import { UseCsrfGuard } from '../csrf/csrf.decorator'
import { CsrfTokenCleanupInterceptor } from '../csrf/csrf-token-cleanup.interceptor'
import {
  AuthLoggerService,
  authLogContextFromRequest,
} from '../../common/auth-logging'
import type {
  AuthAction,
  AuthFailureReason,
} from '../../common/auth-logging/auth-logging.types'

@Controller('auth')
@ApiTags('auth')
@SecureRateLimit()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cartService: CartService,
    private readonly cartIdService: CartIdService,
    private readonly wishlistService: WishlistService,
    private readonly wishlistIdService: WishlistIdService,
    private readonly authLogger: AuthLoggerService
  ) {}

  @Post('login')
  @UseCsrfGuard()
  @UseInterceptors(CsrfTokenCleanupInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  async login(
    @Req() req: Request,
    @ZodBody(LoginRequestSchema) loginRequest: LoginRequest
  ): Promise<LoginResponse> {
    return this.executeWithAuthLogging(
      req,
      'login',
      (statusCode) =>
        statusCode === 401
          ? 'invalid_credentials'
          : statusCode >= 500
            ? 'error'
            : 'unknown',
      () =>
        this.handleAuthWithCartSetup(
          req,
          'login',
          () => this.authService.login(loginRequest),
          LoginResponseSchema
        )
    )
  }

  @Post('register')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Registration successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
  })
  @ApiConflictResponse({
    description: 'User already exists',
  })
  async register(
    @Req() req: Request,
    @ZodBody(RegisterRequestSchema) registerRequest: RegisterRequest
  ): Promise<RegisterResponse> {
    return this.executeWithAuthLogging(
      req,
      'register',
      (statusCode) =>
        statusCode === 409
          ? 'user_exists'
          : statusCode >= 500
            ? 'error'
            : 'unknown',
      () =>
        this.handleAuthWithCartSetup(
          req,
          'register',
          () => this.authService.register(registerRequest),
          RegisterResponseSchema
        )
    )
  }

  /**
   * Runs an auth operation and logs success/failure.
   * - When successOrThrow is false/omitted: operation must return { success, statusCode? }; logs based on result.success.
   * - When successOrThrow is true: any return is treated as success; only throws are logged as failure.
   */
  private async executeWithAuthLogging<T>(
    req: Request,
    action: AuthAction,
    getFailureReason: (statusCode: number) => AuthFailureReason,
    operation: () => Promise<T>,
    successOrThrow?: boolean
  ): Promise<T> {
    try {
      const result = await operation()
      const succeeded =
        successOrThrow || (result as { success: boolean }).success

      if (succeeded) {
        this.authLogger.log({
          action,
          outcome: 'success',
          ...authLogContextFromRequest(req),
        })
      } else {
        this.authLogger.log({
          action,
          outcome: 'failure',
          reason: getFailureReason(
            (result as { statusCode?: number }).statusCode ?? 0
          ),
          ...authLogContextFromRequest(req),
        })
      }
      return result
    } catch (err) {
      const status =
        err instanceof HttpException
          ? err.getStatus()
          : ((err as { statusCode?: number }).statusCode ?? 0)
      this.authLogger.log({
        action,
        outcome: 'failure',
        reason: getFailureReason(status),
        ...authLogContextFromRequest(req),
      })
      throw err
    }
  }

  /**
   * Common handler for authentication operations that need cart and wishlist setup.
   * Gets the guest cart ID and wishlist ID before authentication, performs the auth operation,
   * and sets up the cart and wishlist after successful authentication.
   * If pre-auth steps or auth fail, the error propagates and executeWithAuthLogging logs the failure.
   * If auth succeeds but post-auth setup (cart/wishlist) fails, we log the failure and still return
   * the successful auth result so the user is logged in and the auth audit shows success.
   */
  private async handleAuthWithCartSetup<T extends { success: boolean }>(
    req: Request,
    action: AuthAction,
    authOperation: () => Promise<T>,
    responseSchema: { strip: () => { parse: (data: T) => T } }
  ): Promise<T> {
    // Get guest cart ID and wishlist ID before authentication (while we still have anonymous session)
    const guestCartId = await this.cartIdService.getGuestCartId()
    const guestWishlistId = await this.wishlistIdService.getGuestWishlistId()

    // Fetch guest wishlist data before authentication (while we still have anonymous session)
    const guestWishlistItems = guestWishlistId
      ? await this.wishlistService.getGuestWishlistItemsForMerge()
      : []

    const result = await authOperation()

    // Setup cart and wishlist after successful authentication (handles guest cleanup and customer setup)
    if (result.success) {
      try {
        await Promise.all([
          this.cartService.setupCartAfterLogin(guestCartId),
          this.wishlistService.setupWishlistAfterLogin(
            guestWishlistId,
            guestWishlistItems
          ),
        ])
      } catch (err) {
        this.authLogger.log({
          action,
          outcome: 'failure',
          reason: 'error',
          metadata: {
            phase: 'post_auth_setup',
            message: err instanceof Error ? err.message : String(err),
          },
          ...authLogContextFromRequest(req),
        })
        // Return successful auth result so we do not misreport auth as failed
      }
    }

    return responseSchema.strip().parse(result)
  }

  @Post('logout')
  @UseCsrfGuard()
  @UseInterceptors(CsrfTokenCleanupInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Logout successful',
  })
  async logout(@Req() req: Request): Promise<{ success: boolean }> {
    return this.executeWithAuthLogging(
      req,
      'logout',
      () => 'unknown',
      async () => {
        await this.authService.logout()
        return { success: true }
      }
    )
  }

  @Post('confirm-email')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Email confirmed successfully',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or invalid token',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - user must be logged in',
  })
  async confirmEmail(
    @Req() req: Request,
    @ZodBody(ConfirmEmailRequestSchema) confirmEmailRequest: ConfirmEmailRequest
  ): Promise<ConfirmEmailResponse> {
    return this.executeWithAuthLogging(
      req,
      'confirm_email',
      (statusCode) => (statusCode === 400 ? 'invalid_token' : 'unknown'),
      async () =>
        ConfirmEmailResponseSchema.strip().parse(
          await this.authService.confirmEmail(confirmEmailRequest)
        ),
      true
    )
  }

  @Post('forgot-password')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Password reset token generated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
  })
  async forgotPassword(
    @Req() req: Request,
    @ZodBody(ForgotPasswordRequestSchema)
    forgotPasswordRequest: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    // The service always returns success to prevent email enumeration,
    // so the failure callback below is effectively unreachable in practice.
    return this.executeWithAuthLogging(
      req,
      'forgot_password',
      (statusCode) => (statusCode >= 500 ? 'error' : 'unknown'),
      async () =>
        ForgotPasswordResponseSchema.strip().parse(
          await this.authService.forgotPassword(forgotPasswordRequest)
        )
    )
  }

  @Post('reset-password')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Password reset successfully',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or invalid token',
  })
  async resetPassword(
    @Req() req: Request,
    @ZodBody(ResetPasswordRequestSchema)
    resetPasswordRequest: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    return this.executeWithAuthLogging(
      req,
      'reset_password',
      (statusCode) => (statusCode === 400 ? 'invalid_token' : 'unknown'),
      async () =>
        ResetPasswordResponseSchema.strip().parse(
          await this.authService.resetPassword(resetPasswordRequest)
        )
    )
  }

  @Post('resend-verification-email')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Verification email resent successfully',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
  })
  async resendVerificationEmail(
    @Req() req: Request,
    @ZodBody(ResendVerificationEmailRequestSchema)
    resendRequest: ResendVerificationEmailRequest
  ): Promise<ResendVerificationEmailResponse> {
    // Always returns success to prevent email enumeration.
    return this.executeWithAuthLogging(
      req,
      'resend_verification_email',
      (statusCode) => (statusCode >= 500 ? 'error' : 'unknown'),
      async () =>
        ResendVerificationEmailResponseSchema.strip().parse(
          await this.authService.resendVerificationEmail(resendRequest)
        )
    )
  }
}
