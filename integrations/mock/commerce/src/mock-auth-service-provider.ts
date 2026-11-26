import { Injectable } from '@nestjs/common'
import type {
  AllAuthServices,
  BaseAuthServiceProvider,
} from '@core/contracts/core/data-source-interfaces'
import {
  MockAnonymousSessionService,
  MockConfirmEmailService,
  MockForgotPasswordService,
  MockGenerateEmailTokenService,
  MockLoginService,
  MockLogoutService,
  MockRefreshTokenService,
  MockRegisterService,
  MockResetPasswordService,
} from './services/auth'

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
