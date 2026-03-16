import { handleErrorResponse } from '@/lib/bff/utils/error-response'
import { LoginRequest, LoginResponse } from '@core/contracts/auth/login'
import {
  RegisterRequest,
  RegisterResponse,
} from '@core/contracts/auth/register'
import {
  ConfirmEmailRequest,
  ConfirmEmailResponse,
} from '@core/contracts/auth/confirm-email'
import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from '@core/contracts/auth/forgot-password'
import {
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@core/contracts/auth/reset-password'
import {
  ResendVerificationEmailRequest,
  ResendVerificationEmailResponse,
} from '@core/contracts/auth/resend-verification-email'
import { BaseService } from '@/lib/bff/services/base-service'

/**
 * Service for authentication operations (BFF client).
 * Lives in the auth feature; lib/bff does not define or import auth.
 */
export class AuthService extends BaseService {
  async login(request: LoginRequest): Promise<LoginResponse> {
    return await this.post<LoginResponse>('/auth/login', request, {
      onError: (res) => handleErrorResponse<LoginResponse>(res),
    })
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    return await this.post<RegisterResponse>('/auth/register', request, {
      onError: (res) => handleErrorResponse<RegisterResponse>(res),
    })
  }

  async logout(): Promise<void> {
    await this.post('/auth/logout')
  }

  async confirmEmail(
    request: ConfirmEmailRequest
  ): Promise<ConfirmEmailResponse> {
    return await this.post<ConfirmEmailResponse>(
      '/auth/confirm-email',
      request,
      {
        onError: (res) => handleErrorResponse<ConfirmEmailResponse>(res),
      }
    )
  }

  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    return await this.post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      request,
      {
        onError: (res) => handleErrorResponse<ForgotPasswordResponse>(res),
      }
    )
  }

  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    return await this.post<ResetPasswordResponse>(
      '/auth/reset-password',
      request,
      {
        onError: (res) => handleErrorResponse<ResetPasswordResponse>(res),
      }
    )
  }

  async resendVerificationEmail(
    request: ResendVerificationEmailRequest
  ): Promise<ResendVerificationEmailResponse> {
    return await this.post<ResendVerificationEmailResponse>(
      '/auth/resend-verification-email',
      request,
      {
        onError: (res) =>
          handleErrorResponse<ResendVerificationEmailResponse>(res),
      }
    )
  }
}
