import { defineRouting } from 'next-intl/routing'
import { I18N_CONFIG, getLocale, listLocales } from '@config/constants'

export const routing = defineRouting({
  locales: listLocales().map((l) => l.urlPrefix),
  defaultLocale: getLocale(I18N_CONFIG.defaultLocale).urlPrefix,
  localePrefix: 'as-needed',
  localeDetection: true,
})
