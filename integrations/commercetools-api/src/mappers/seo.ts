import type { PageSeo } from '@core/contracts/page/page'

type LocalizedValue = Record<string, string> | undefined

// Current language only: another language's meta text is worse than the storefront fallback.
function pickLanguage(value: LocalizedValue, language: string) {
  return value?.[language]?.trim() || undefined
}

/**
 * Maps commercetools `metaTitle` / `metaDescription` (products and categories)
 * to the page SEO contract. Returns undefined when neither is set for the language.
 */
export function mapMetaSeo(
  source: { metaTitle?: LocalizedValue; metaDescription?: LocalizedValue },
  language: string
): PageSeo | undefined {
  const metaTitle = pickLanguage(source.metaTitle, language)
  const metaDescription = pickLanguage(source.metaDescription, language)
  if (!metaTitle && !metaDescription) {
    return undefined
  }
  return {
    ...(metaTitle && { metaTitle }),
    ...(metaDescription && { metaDescription }),
  }
}
