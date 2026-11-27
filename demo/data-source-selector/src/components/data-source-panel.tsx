'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { ProviderView, Selection } from '@demo/provider-switch/view'
import { setupRows } from '../rows'
import { writeProviderCookie } from '../cookies'
import { DataSourceSelector } from './data-source-selector'
import { selectorLabels } from './labels'

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
      labels={selectorLabels(t)}
      rows={rows}
      onSelect={(cookie, provider) => writeProviderCookie(cookie, provider)}
    />
  )
}
