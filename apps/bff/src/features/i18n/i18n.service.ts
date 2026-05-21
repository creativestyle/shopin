import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { I18N_CONFIG, SupportedLocale } from '@config/constants'
import { Translations } from '@core/i18n'

// Import JSON files directly
import enUSTranslations from '@core/i18n/en-US.json'
import deDETranslations from '@core/i18n/de-DE.json'

@Injectable()
export class I18nService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(I18nService.name)
  }
  private readonly defaultLocale = I18N_CONFIG.defaultLocale
  private readonly supportedLocales = I18N_CONFIG.supportedLocales

  // Map of translations from imported JSON files
  private readonly translations = {
    'en-US': enUSTranslations,
    'de-DE': deDETranslations,
  } as const

  async getTranslations(lang: string): Promise<Translations> {
    // Validate language against predefined list for security
    if (!this.supportedLocales.includes(lang as SupportedLocale)) {
      this.logger.warn(
        { requested: lang, fallback: this.defaultLocale },
        'Unsupported language requested, using fallback'
      )
      return this.getDefaultTranslations()
    }

    // Return translations directly from imported JSON files
    return (
      this.translations[lang as SupportedLocale] ||
      this.getDefaultTranslations()
    )
  }

  private getDefaultTranslations(): Translations {
    return this.translations[this.defaultLocale]
  }

  async getAvailableLanguages(): Promise<string[]> {
    // Return predefined list for security - no directory scanning
    return [...this.supportedLocales]
  }
}
