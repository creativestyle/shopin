import type { DataSourceSelectorLabels } from './data-source-selector'

/** The `dataSourceSelector` texts as next-intl's translator reads them (`useTranslations`, `createTranslator`). */
interface SelectorTranslator {
  (key: string, values?: Record<string, string>): string
  has(key: string): boolean
}

/**
 * The selector's labels from the storefront texts (`dataSourceSelector`): the fixed reasons a category is not
 * available (`reasons.notConfigured`, `reasons.checkFailed`) take the provider's name as `{provider}`.
 */
export function selectorLabels(
  t: SelectorTranslator
): DataSourceSelectorLabels {
  return {
    title: t('title'),
    intro: t('intro'),
    select: t('select'),
    selected: t('selected'),
    unavailable: t('unavailable'),
    reasons: {
      notConfigured: (provider) => t('reasons.notConfigured', { provider }),
      checkFailed: (provider) => t('reasons.checkFailed', { provider }),
    },
    category: (category) =>
      t.has(`categories.${category}`) ? t(`categories.${category}`) : category,
  }
}
