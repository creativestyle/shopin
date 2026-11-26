import {
  Injectable,
  CanActivate,
  ForbiddenException,
  type ExecutionContext,
} from '@nestjs/common'
import { ContextIdFactory, ModuleRef } from '@nestjs/core'
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

/**
 * The CSRF check on every route of a controller that changes state (the shop's own routes get it by default). It
 * resolves the request-scoped token service per request, so a controller it guards stays a singleton.
 */
@Injectable()
export class CsrfOnWritesGuard implements CanActivate {
  constructor(private readonly moduleRef: ModuleRef) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ method?: string }>()
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method ?? 'GET')) {
      return true
    }
    // the token service reads this request (REQUEST): register it for the context id the guard resolves in
    const contextId = ContextIdFactory.getByRequest(request)
    this.moduleRef.registerRequestByContextId(request, contextId)
    const tokens = await this.moduleRef.resolve(CsrfTokenService, contextId, {
      strict: false,
    })
    return new CsrfGuard(tokens).canActivate()
  }
}
