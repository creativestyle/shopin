import type { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import type { FooterResponse } from '@core/contracts/content/layout'
import { isNonIndexablePath, stripLocalePrefix } from '../non-indexable-paths'

const CATEGORY_PATH_PREFIX = '/c/'
const PRODUCT_PATH_PREFIX = '/p/'

type NavigationItem = {
  href: string
  children?: NavigationItem[]
}

/** Drops the query string / fragment and any locale prefix from an internal link. */
function normalizeInternalPath(href: string): string | null {
  if (!href.startsWith('/')) {
    // Absolute (external) or mailto/tel links have no place in our sitemap.
    return null
  }
  const path = stripLocalePrefix(href.split(/[?#]/)[0] ?? '')
  return path && path !== '/' ? path.replace(/\/$/, '') : null
}

/**
 * Category paths ("/c/audio") from the main navigation, walking all nesting
 * levels. The navigation is the only catalog-wide category listing the BFF
 * exposes, so it doubles as the sitemap's category source.
 */
export function collectCategoryPaths(
  navigation: MainNavigationResponse | null
): string[] {
  return [...walkCategoryPaths(navigation?.items as NavigationItem[], true)]
}

/**
 * The categories to actually *query* when enumerating products, as opposed to the
 * ones to list as URLs.
 *
 * With subtree category semantics (commercetools: `categoriesSubTree`) a
 * top-level category already returns every product beneath it, so querying its
 * children repeats the same products — on a three-level tree that is ~3× the
 * requests for zero extra URLs. `includeSubcategories` restores the full walk for
 * a data source that scopes products to the exact category.
 */
export function collectProductDiscoveryPaths(
  navigation: MainNavigationResponse | null,
  includeSubcategories: boolean
): string[] {
  return [
    ...walkCategoryPaths(
      navigation?.items as NavigationItem[],
      includeSubcategories
    ),
  ]
}

function walkCategoryPaths(
  items: NavigationItem[] | undefined,
  descend: boolean
): Set<string> {
  const paths = new Set<string>()

  const walk = (level: NavigationItem[] | undefined) => {
    for (const item of level ?? []) {
      const path = normalizeInternalPath(item.href)
      const isCategory = path?.startsWith(CATEGORY_PATH_PREFIX) === true
      if (isCategory && path && !isNonIndexablePath(path)) {
        paths.add(path)
      }
      // Without descend we stop at the outermost category of each branch, but keep
      // traversing non-category entries (e.g. a CMS landing page that groups
      // categories) so their category children are not lost.
      if (descend || !isCategory) {
        walk(item.children)
      }
    }
  }

  walk(items)
  return paths
}

/**
 * CMS page paths ("/about") harvested from footer links.
 *
 * The content BFF has no "list all pages" endpoint, so footer navigation is the
 * only discoverable set of CMS URLs. Category/product links and non-indexable
 * routes are filtered out; they are contributed by their own collectors.
 */
export function collectContentPaths(footer: FooterResponse | null): string[] {
  if (!footer) {
    return []
  }

  const links = [
    ...footer.sections.flatMap((section) => section.links),
    ...footer.legalLinks,
    ...(footer.customerService?.contactUs
      ? [footer.customerService.contactUs]
      : []),
  ]

  const paths = new Set<string>()
  for (const link of links) {
    if (link.noIndex === true || !link.url) {
      continue
    }
    const path = normalizeInternalPath(link.url)
    if (
      path &&
      !path.startsWith(CATEGORY_PATH_PREFIX) &&
      !path.startsWith(PRODUCT_PATH_PREFIX) &&
      !isNonIndexablePath(path)
    ) {
      paths.add(path)
    }
  }
  return [...paths]
}
