import { I18N_REVALIDATE_SECONDS } from '@config/constants'
import { BaseService } from './base-service'
import { logger } from '@/lib/logger'

/**
 * Service for i18n operations
 */
export class I18nService extends BaseService {
  /**
   * Get translations for a locale
   * @param rfcLocale - RFC locale (e.g., 'en-US', 'de-DE')
   * @param responseLocalePrefix - URL prefix locale (e.g., 'en', 'de')
   * @returns Translations object and locale
   */
  async getTranslations(
    rfcLocale: string,
    responseLocalePrefix: string
  ): Promise<{ locale: string; messages: Record<string, unknown> }> {
    const messages = await this.get<Record<string, unknown>>(
      `i18n/translations/${rfcLocale}`,
      {
        next: {
          tags: [`i18n-${rfcLocale}`, 'i18n-translations'],
          revalidate: I18N_REVALIDATE_SECONDS,
        },
        onError: (res) => {
          logger.warn(
            {
              path: `i18n/translations/${rfcLocale}`,
              status: res.status,
              statusText: res.statusText,
              rfcLocale,
            },
            'Failed to fetch translations'
          )
          return {}
        },
        onNetworkError: (error) => {
          logger.error(
            {
              path: `i18n/translations/${rfcLocale}`,
              error: error instanceof Error ? error.message : String(error),
              rfcLocale,
            },
            'Error fetching translations'
          )
          return {}
        },
      }
    )
    return { locale: responseLocalePrefix, messages }
  }
}
