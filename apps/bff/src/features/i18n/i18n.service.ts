import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { I18N_CONFIG, SupportedLocale } from '@config/constants'
import { Translations } from '@core/i18n'

// Import JSON files directly
import enUSTranslations from '@core/i18n/en-US.json'
import deDETranslations from '@core/i18n/de-DE.json'

/** SHOPin's own texts, by locale. A shop locale without them gets the English ones (the shop's texts go over). */
const SHOPIN_TEXTS: Readonly<Record<string, Translations>> = {
  'en-US': enUSTranslations,
  'de-DE': deDETranslations,
}

@Injectable()
export class I18nService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(I18nService.name)
  }
  private readonly defaultLocale = I18N_CONFIG.defaultLocale
  private readonly supportedLocales = I18N_CONFIG.supportedLocales

  async getTranslations(lang: string): Promise<Translations> {
    // Validate language against predefined list for security
    if (!this.supportedLocales.includes(lang as SupportedLocale)) {
      this.logger.warn(
        { requested: lang, fallback: this.defaultLocale },
        'Unsupported language requested, using fallback'
      )
      return this.textsOf(this.defaultLocale)
    }
    return this.textsOf(lang)
  }

  /** SHOPin's texts in `locale`, or in English for a locale SHOPin has none for (the shop's own Messages supply it). */
  private textsOf(locale: string): Translations {
    return SHOPIN_TEXTS[locale] ?? SHOPIN_TEXTS['en-US']!
  }

  async getAvailableLanguages(): Promise<string[]> {
    // Return predefined list for security - no directory scanning
    return [...this.supportedLocales]
  }
}
