import type { Selection } from '@demo/provider-switch/view'

/**
 * The data sources the demo offers on /setup, as shopin has always shown them: each one picks a provider per
 * category of the demo's switch (demo/shop): search is the commerce provider's own product search, or Algolia over
 * the commercetools index. Their names and descriptions are
 * `dataSourceSelector.sources.<key>` in the storefront texts.
 */
export const DATA_SOURCES: Readonly<Record<string, Selection>> = {
  'mock-set': {
    commerce: 'mock',
    cms: 'mock',
    auth: 'mock-identity',
    search: 'commerce',
  },
  'commercetools-set': {
    commerce: 'commercetools',
    cms: 'contentful',
    auth: 'commercetools',
    search: 'commerce',
  },
  'commercetools-algolia-set': {
    commerce: 'commercetools',
    cms: 'contentful',
    auth: 'commercetools',
    search: 'algolia',
  },
}

/** The data source shown as selected when the page's providers match none. */
export const DEFAULT_DATA_SOURCE = 'commercetools-set'

/** The data source whose providers the page is rendered with (the default when the selection matches none). */
export function dataSourceOf(selected: Selection): string {
  return (
    Object.keys(DATA_SOURCES).find((source) =>
      Object.entries(DATA_SOURCES[source]!).every(
        ([category, id]) => selected[category as keyof Selection] === id
      )
    ) ?? DEFAULT_DATA_SOURCE
  )
}
