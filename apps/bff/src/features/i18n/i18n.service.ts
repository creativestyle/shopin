import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { I18N_CONFIG, SupportedLanguage } from '@config/constants'
import { Translations } from '@core/i18n'

// Import JSON files directly
import enUSTranslations from '@core/i18n/en-US.json'
import deDETranslations from '@core/i18n/de-DE.json'

@Injectable()
export class I18nService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(I18nService.name)
  }
  private readonly defaultLanguage = I18N_CONFIG.defaultLanguage
  private readonly supportedLanguages = I18N_CONFIG.supportedLanguages

  // Map of translations from imported JSON files
  private readonly translations = {
    'en-US': enUSTranslations,
    'de-DE': deDETranslations,
  } as const

  async getTranslations(lang: string): Promise<Translations> {
    // Validate language against predefined list for security
    if (!this.supportedLanguages.includes(lang as SupportedLanguage)) {
      this.logger.warn(
        { requested: lang, fallback: this.defaultLanguage },
        'Unsupported language requested, using fallback'
      )
      return this.getDefaultTranslations()
    }

    // Return translations directly from imported JSON files
    return (
      this.translations[lang as SupportedLanguage] ||
      this.getDefaultTranslations()
    )
  }

  private getDefaultTranslations(): Translations {
    return this.translations[this.defaultLanguage]
  }

  async getAvailableLanguages(): Promise<string[]> {
    // Return predefined list for security - no directory scanning
    return [...this.supportedLanguages]
  }
}
