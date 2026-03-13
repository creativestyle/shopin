import { getRequestConfig } from 'next-intl/server'
import { getServerBffClient } from '../lib/bff/services/server-service'
import { I18N_CONFIG, URL_PREFIXES, urlPrefixToRfc } from '@config/constants'

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale

  // Resolve effective locale before creating BFF client to avoid
  // getLocale() → getRequestConfig() infinite loop when locale is undefined
  const effectivePrefix =
    locale && Object.values(URL_PREFIXES).includes(locale)
      ? locale
      : URL_PREFIXES[I18N_CONFIG.defaultLanguage]
  const effectiveRfc = urlPrefixToRfc(effectivePrefix)

  const { i18nService } = await getServerBffClient(effectivePrefix)

  const { locale: responseLocale, messages } =
    await i18nService.getTranslations(effectiveRfc, effectivePrefix)

  return { locale: responseLocale, messages }
})
