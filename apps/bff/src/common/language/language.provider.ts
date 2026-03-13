import { Injectable, Inject, Scope } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import type { SupportedLanguage } from '@config/constants'
import { I18N_CONFIG } from '@config/constants'
import type { LanguageRequest } from '@core/i18n'

@Injectable({
  scope: Scope.REQUEST,
})
export class LanguageProvider {
  constructor(@Inject(REQUEST) private readonly request: LanguageRequest) {}

  getCurrentLanguage(): SupportedLanguage {
    return (
      (this.request.language as SupportedLanguage) ||
      I18N_CONFIG.defaultLanguage
    )
  }
}
