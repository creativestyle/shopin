import type { CategoryApiResponse } from '../schemas/category'
import type { LinkResponse, SubcategoryLink } from '@core/contracts/core/link'

export interface CategoryNode {
  id: string
  name: string
  slug: string
  children: CategoryNode[]
}

/**
 * Builds a hierarchical tree from flat category list using parent references
 */
export function buildCategoryTree(
  categories: CategoryApiResponse[],
  dataLocale: string,
  fallbackLocale: string
): CategoryNode[] {
  // Create a map for quick lookup
  const categoryMap = new Map<string, CategoryNode>()

  // First pass: create all nodes
  for (const category of categories) {
    const name =
      category.name?.[dataLocale] ||
      category.name?.[fallbackLocale] ||
      'Unnamed Category'
    const slug =
      category.slug?.[dataLocale] ||
      category.slug?.[fallbackLocale] ||
      category.id

    categoryMap.set(category.id, {
      id: category.id,
      name,
      slug,
      children: [],
    })
  }

  // Second pass: build tree by connecting parents and children
  const rootCategories: CategoryNode[] = []

  for (const category of categories) {
    const node = categoryMap.get(category.id)
    if (!node) {
      continue
    }

    if (category.parent?.id) {
      // Has parent - add to parent's children
      const parent = categoryMap.get(category.parent.id)
      if (parent) {
        parent.children.push(node)
      }
    } else {
      // No parent - this is a root category
      rootCategories.push(node)
    }
  }

  return rootCategories
}

/**
 * Recursively maps a CategoryNode to LinkResponse format
 */
export function mapCategoryToLink(category: CategoryNode): LinkResponse {
  const children: SubcategoryLink[] | undefined =
    category.children.length > 0
      ? category.children.map((child) => ({
          text: child.name,
          href: `/c/${child.slug}`,
          children:
            child.children.length > 0
              ? child.children.map((grandchild) => ({
                  text: grandchild.name,
                  href: `/c/${grandchild.slug}`,
                  children:
                    grandchild.children.length > 0
                      ? grandchild.children.map((greatGrandchild) => ({
                          text: greatGrandchild.name,
                          href: `/c/${greatGrandchild.slug}`,
                        }))
                      : undefined,
                }))
              : undefined,
        }))
      : undefined

  return {
    text: category.name,
    href: `/c/${category.slug}`,
    children,
  }
}
