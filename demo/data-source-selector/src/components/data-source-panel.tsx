'use client'

import { useTranslations } from 'next-intl'
import type { ProviderView, Selection } from '@demo/provider-switch/view'
import { DATA_SOURCES, dataSourceOf } from '../sets'
import { writeProviderCookie } from '../cookies'
import { DataSourceSelector } from './data-source-selector'

/**
 * shopin's data-source selector with its texts (`dataSourceSelector` in the storefront texts): choosing a data
 * source writes the switch's cookie of each category it names.
 */
export function DataSourcePanel({
  providers,
  selected,
}: {
  providers: ProviderView
  selected: Selection
}) {
  const t = useTranslations('dataSourceSelector')
  const cookies = Object.fromEntries(
    providers.map((view) => [view.category, view.cookie])
  )

  const options = Object.keys(DATA_SOURCES).map((value) => ({
    value,
    name: t(`sources.${value}.name`),
    description: t(`sources.${value}.description`),
  }))

  return (
    <DataSourceSelector
      initialDataSource={dataSourceOf(selected)}
      labels={{
        title: t('title'),
        intro: t('intro'),
        select: t('select'),
        selected: t('selected'),
        currentSelection: t('currentSelection'),
      }}
      options={options}
      onSelect={(dataSource) => {
        for (const [category, provider] of Object.entries(
          DATA_SOURCES[dataSource] ?? {}
        )) {
          const cookie = cookies[category]
          if (cookie && provider) {
            writeProviderCookie(cookie, provider)
          }
        }
      }}
    />
  )
}
