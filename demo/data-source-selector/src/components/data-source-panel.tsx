'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { ProviderView, Selection } from '@demo/provider-switch/view'
import { setupRows } from '../rows'
import { writeProviderCookie } from '../cookies'
import { DataSourceSelector } from './data-source-selector'

/**
 * The provider switch with its texts (`dataSourceSelector` in the storefront texts): per category the installed
 * integrations, by their descriptors' labels; choosing one writes that category's switch cookie.
 */
export function DataSourcePanel({
  providers,
  selected,
}: {
  providers: ProviderView
  selected: Selection
}) {
  const t = useTranslations('dataSourceSelector')
  const locale = useLocale()
  const rows = setupRows(providers, selected, locale)

  return (
    <DataSourceSelector
      labels={{
        title: t('title'),
        intro: t('intro'),
        select: t('select'),
        selected: t('selected'),
        unavailable: t('unavailable'),
        category: (category) =>
          t.has(`categories.${category}`)
            ? t(`categories.${category}`)
            : category,
      }}
      rows={rows}
      onSelect={(cookie, provider) => writeProviderCookie(cookie, provider)}
    />
  )
}
