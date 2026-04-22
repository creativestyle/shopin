import type { Category, LocalizedString } from '@commercetools/platform-sdk'
import { getLocalizedString } from '../helpers/get-localized-string'

/**
 * Builds a breadcrumb chain from a flat list of categories and the current category.
 * Walks up via parent references from the flat list.
 */
export function buildCategoryBreadcrumb(
  allCategories: Category[],
  currentCategory: Category,
  language: string,
  categoryById?: ReadonlyMap<string, Category>
): { label: string; path: string }[] {
  const byId =
    categoryById ?? new Map(allCategories.map((c) => [c.id, c] as const))

  const chain: Category[] = []
  let current: Category | undefined = currentCategory
  while (current) {
    chain.unshift(current)
    const parentId: string | undefined = current.parent?.id
    current = parentId ? byId.get(parentId) : undefined
  }

  return chain.flatMap((cat) => {
    const slug = getLocalizedString(cat.slug as LocalizedString, language)
    if (!slug) {
      return []
    }
    return [
      {
        label:
          getLocalizedString(cat.name as LocalizedString, language) || slug,
        path: `/c/${slug}`,
      },
    ]
  })
}
