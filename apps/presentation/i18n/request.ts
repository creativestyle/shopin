import { getRequestConfig } from 'next-intl/server'
import { getServerBffClient } from '../lib/bff/services/server-service'
import {
  listLocales,
  getDefaultLocale,
  urlPrefixToRfc,
} from '@config/constants'

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale

  const effectivePrefix =
    locale && listLocales().some((l) => l.urlPrefix === locale)
      ? locale
      : getDefaultLocale().urlPrefix
  const effectiveRfc = urlPrefixToRfc(effectivePrefix)

  const { i18nService } = await getServerBffClient(effectivePrefix)

  const { locale: responseLocale, messages } =
    await i18nService.getTranslations(effectiveRfc, effectivePrefix)

  return { locale: responseLocale, messages }
})
