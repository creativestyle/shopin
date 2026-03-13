import type { LocalizedString, Category } from '@commercetools/platform-sdk'
import type { CategoryTreeNode } from '@core/contracts/product-collection/product-collection'
import { getLocalizedString } from '../helpers/get-localized-string'

export function mapCategoryTree(
  categories: Category[],
  parentId: string | undefined,
  language: string
): CategoryTreeNode[] {
  return categories
    .filter((cat) => {
      const catParentId = cat.parent?.id
      return parentId ? catParentId === parentId : !catParentId
    })
    .map((cat) => {
      const children = mapCategoryTree(categories, cat.id, language)
      return {
        id: cat.id,
        name:
          getLocalizedString(cat.name as LocalizedString, language) || cat.id,
        slug:
          getLocalizedString(cat.slug as LocalizedString, language) || cat.id,
        ...(children.length > 0 && { children }),
      }
    })
}
