import { Injectable, NestMiddleware, Scope } from '@nestjs/common'
import { Response, NextFunction } from 'express'
import {
  AcceptLanguageUtils,
  LANGUAGE_HEADER,
  LanguageRequest,
} from '@core/i18n'
@Injectable({ scope: Scope.REQUEST })
export class LanguageHeaderMiddleware implements NestMiddleware {
  use(req: LanguageRequest, res: Response, next: NextFunction) {
    const acceptLanguageHeader = req.headers[LANGUAGE_HEADER]
    req.language = AcceptLanguageUtils.getBestSupportedLanguage(
      acceptLanguageHeader?.toString() || ''
    )
    next()
  }
}
