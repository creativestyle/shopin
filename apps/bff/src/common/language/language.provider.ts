import { Injectable, Inject, Scope } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import type { SupportedLocale } from '@config/constants'
import { I18N_CONFIG } from '@config/constants'
import type { LanguageRequest } from '@core/i18n'

@Injectable({
  scope: Scope.REQUEST,
})
export class LanguageProvider {
  constructor(@Inject(REQUEST) private readonly request: LanguageRequest) {}

  getCurrentLanguage(): SupportedLocale {
    return (
      (this.request.language as SupportedLocale) || I18N_CONFIG.defaultLocale
    )
  }
}
