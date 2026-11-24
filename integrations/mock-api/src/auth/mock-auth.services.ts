import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { randomUUID } from 'crypto'
import type {
  AllAuthServices,
  BaseAuthServiceProvider,
} from '@core/contracts/core/data-source-interfaces'
import type {
  LoginRequest,
  LoginResponse,
  TokenFields,
} from '@core/contracts/auth/login'
import type {
  RegisterRequest,
  RegisterResponse,
} from '@core/contracts/auth/register'
import type { LogoutRequest } from '@core/contracts/auth/logout'
import type {
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@core/contracts/auth/refresh-token'
import type {
  AnonymousSessionResponse,
  AnonymousSessionTokenFields,
} from '@core/contracts/auth/anonymous-session'
import type {
  ConfirmEmailRequest,
  ConfirmEmailResponse,
} from '@core/contracts/auth/confirm-email'
import type {
  GenerateEmailTokenRequest,
  GenerateEmailTokenResponse,
} from '@core/contracts/auth/generate-email-token'
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from '@core/contracts/auth/forgot-password'
import type {
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@core/contracts/auth/reset-password'
import { MockSessionService } from '../session/mock-session.service'
import {
  assignSessionToCustomer,
  createSession,
  findCustomerByEmail,
  getCustomer,
  hashPassword,
  issueEmailToken,
  issuePasswordToken,
  redeemEmailToken,
  redeemPasswordToken,
  refreshSession,
  revokeTokens,
  saveCustomer,
} from '../session/mock-session-store'

@Injectable()
export class MockAnonymousSessionService {
  async createAnonymousSession(): Promise<
    AnonymousSessionResponse & AnonymousSessionTokenFields
  > {
    return { success: true, ...createSession() }
  }
}

@Injectable()
export class MockLoginService {
  constructor(private readonly sessionService: MockSessionService) {}

  async login(
    loginRequest: LoginRequest
  ): Promise<LoginResponse & TokenFields> {
    const customer = findCustomerByEmail(loginRequest.email)
    if (
      !customer ||
      customer.passwordHash !== hashPassword(loginRequest.password)
    ) {
      throw new UnauthorizedException('Invalid email or password')
    }
    if (!customer.isEmailVerified) {
      throw new ForbiddenException(
        'Please verify your email address before logging in'
      )
    }

    // Like commercetools' me().login(): the guest session's cart moves to the customer
    const guestSessionId = await this.sessionService.getSessionId()
    if (guestSessionId) {
      assignSessionToCustomer(guestSessionId, customer.id)
    }

    return { success: true, ...createSession(customer.id) }
  }
}

@Injectable()
export class MockRegisterService {
  async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
    if (findCustomerByEmail(registerRequest.email)) {
      throw new ConflictException('Email is already in use')
    }
    saveCustomer({
      id: `mock-customer-${randomUUID()}`,
      email: registerRequest.email.trim(),
      firstName: registerRequest.firstName,
      lastName: registerRequest.lastName,
      salutation: registerRequest.salutation || undefined,
      dateOfBirth: registerRequest.dateOfBirth || undefined,
      version: 1,
      passwordHash: hashPassword(registerRequest.password),
      isEmailVerified: false,
      addresses: [],
    })
    return { success: true }
  }
}

@Injectable()
export class MockLogoutService {
  async logout(logoutRequest: LogoutRequest): Promise<void> {
    revokeTokens(logoutRequest.accessToken, logoutRequest.refreshToken)
  }
}

@Injectable()
export class MockRefreshTokenService {
  async refreshToken(
    refreshTokenRequest: RefreshTokenRequest
  ): Promise<RefreshTokenResponse> {
    const tokens = refreshSession(refreshTokenRequest.refreshToken)
    if (!tokens) {
      throw new UnauthorizedException('Invalid refresh token')
    }
    return tokens
  }
}

@Injectable()
export class MockGenerateEmailTokenService {
  async generateEmailToken(
    request: GenerateEmailTokenRequest
  ): Promise<GenerateEmailTokenResponse> {
    const customer = findCustomerByEmail(request.email)
    return { emailToken: customer ? issueEmailToken(customer.id) : undefined }
  }
}

@Injectable()
export class MockConfirmEmailService {
  async confirmEmail(
    request: ConfirmEmailRequest
  ): Promise<ConfirmEmailResponse> {
    const result = redeemEmailToken(request.tokenValue)
    const customer =
      typeof result === 'string' ? undefined : getCustomer(result.customerId)
    if (!customer) {
      const message = typeof result === 'string' ? result : 'token_invalid'
      return { success: false, statusCode: 400, message }
    }
    saveCustomer({
      ...customer,
      isEmailVerified: true,
      version: customer.version + 1,
    })
    return { success: true }
  }
}

@Injectable()
export class MockForgotPasswordService {
  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    const customer = findCustomerByEmail(request.email)
    if (!customer) {
      return { success: false }
    }
    return {
      success: true,
      passwordResetToken: issuePasswordToken(customer.id),
    }
  }
}

@Injectable()
export class MockResetPasswordService {
  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    const result = redeemPasswordToken(request.tokenValue)
    const customer =
      typeof result === 'string' ? undefined : getCustomer(result.customerId)
    if (!customer) {
      const message = typeof result === 'string' ? result : 'token_invalid'
      return { success: false, statusCode: 400, message }
    }
    saveCustomer({
      ...customer,
      passwordHash: hashPassword(request.newPassword),
      version: customer.version + 1,
    })
    return { success: true }
  }
}

export const MOCK_AUTH_SERVICES = [
  MockAnonymousSessionService,
  MockLoginService,
  MockRegisterService,
  MockLogoutService,
  MockRefreshTokenService,
  MockGenerateEmailTokenService,
  MockConfirmEmailService,
  MockForgotPasswordService,
  MockResetPasswordService,
]

export type MockAuthServiceProvider = BaseAuthServiceProvider<AllAuthServices>

@Injectable()
export class MockAuthServiceProviderImpl implements MockAuthServiceProvider {
  constructor(
    private readonly anonymousSessionService: MockAnonymousSessionService,
    private readonly loginService: MockLoginService,
    private readonly registerService: MockRegisterService,
    private readonly logoutService: MockLogoutService,
    private readonly refreshTokenService: MockRefreshTokenService,
    private readonly generateEmailTokenService: MockGenerateEmailTokenService,
    private readonly confirmEmailService: MockConfirmEmailService,
    private readonly forgotPasswordService: MockForgotPasswordService,
    private readonly resetPasswordService: MockResetPasswordService
  ) {}

  getAuthServices(): AllAuthServices {
    return {
      anonymousSessionService: this.anonymousSessionService,
      loginService: this.loginService,
      registerService: this.registerService,
      logoutService: this.logoutService,
      refreshTokenService: this.refreshTokenService,
      generateEmailTokenService: this.generateEmailTokenService,
      confirmEmailService: this.confirmEmailService,
      forgotPasswordService: this.forgotPasswordService,
      resetPasswordService: this.resetPasswordService,
    }
  }
}
