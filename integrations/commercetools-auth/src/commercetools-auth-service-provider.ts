import { Injectable } from '@nestjs/common'
import { CommercetoolsAuthServiceProvider } from './interfaces'
import {
  CommercetoolsLoginService,
  CommercetoolsRegisterService,
  CommercetoolsLogoutService,
  CommercetoolsRefreshTokenService,
  CommercetoolsAnonymousSessionService,
  CommercetoolsConfirmEmailService,
  CommercetoolsGenerateEmailTokenService,
  CommercetoolsGeneratePasswordTokenService,
  CommercetoolsResetPasswordService,
} from './services'

@Injectable()
export class CommercetoolsAuthServiceProviderImpl implements CommercetoolsAuthServiceProvider {
  constructor(
    private readonly loginService: CommercetoolsLoginService,
    private readonly registerService: CommercetoolsRegisterService,
    private readonly logoutService: CommercetoolsLogoutService,
    private readonly refreshTokenService: CommercetoolsRefreshTokenService,
    private readonly anonymousSessionService: CommercetoolsAnonymousSessionService,
    private readonly confirmEmailService: CommercetoolsConfirmEmailService,
    private readonly generateEmailTokenService: CommercetoolsGenerateEmailTokenService,
    private readonly generatePasswordTokenService: CommercetoolsGeneratePasswordTokenService,
    private readonly resetPasswordService: CommercetoolsResetPasswordService
  ) {}

  getAuthServices() {
    return {
      loginService: this.loginService,
      registerService: this.registerService,
      logoutService: this.logoutService,
      refreshTokenService: this.refreshTokenService,
      anonymousSessionService: this.anonymousSessionService,
      confirmEmailService: this.confirmEmailService,
      generateEmailTokenService: this.generateEmailTokenService,
      forgotPasswordService: this.generatePasswordTokenService,
      resetPasswordService: this.resetPasswordService,
    }
  }
}
