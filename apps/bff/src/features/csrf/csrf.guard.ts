import { Injectable, CanActivate, ForbiddenException } from '@nestjs/common'
import { CsrfTokenService } from './csrf-token.service'

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly csrfTokenService: CsrfTokenService) {}

  async canActivate(): Promise<boolean> {
    const headerToken = this.csrfTokenService.getTokenFromHeader()
    const cookieToken = this.csrfTokenService.getTokenFromCookie()

    if (
      !(await this.csrfTokenService.validateTokens(headerToken, cookieToken))
    ) {
      throw new ForbiddenException('Invalid or missing CSRF token')
    }

    return true
  }
}
