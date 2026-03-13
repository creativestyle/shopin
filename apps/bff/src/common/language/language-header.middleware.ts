import { Injectable, NestMiddleware, Scope } from '@nestjs/common'
import { Response, NextFunction } from 'express'
import {
  AcceptLanguageUtils,
  LANGUAGE_HEADER,
  LanguageRequest,
} from '@core/i18n'

/**
 * Middleware that reads Accept-Language header and sets language context
 */
@Injectable({ scope: Scope.REQUEST })
export class LanguageHeaderMiddleware implements NestMiddleware {
  use(req: LanguageRequest, res: Response, next: NextFunction) {
    const acceptLanguageHeader = req.headers[LANGUAGE_HEADER]
    const language = AcceptLanguageUtils.getBestSupportedLanguage(
      acceptLanguageHeader?.toString() || ''
    )

    req.language = language
    next()
  }
}
