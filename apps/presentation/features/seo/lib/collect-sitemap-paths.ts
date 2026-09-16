import type { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import type { FooterResponse } from '@core/contracts/content/layout'
import { isCategoryPath, isProductPath } from '@config/constants'
import { isNonIndexablePath, stripLocalePrefix } from '../non-indexable-paths'

type NavigationItem = {
  href: string
  children?: NavigationItem[]
}

/**
 * Reduces a link to a locale-less internal path, or null when it is not one.
 *
 * Accepts both root-relative hrefs ("/c/audio") and absolute URLs on our own
 * origin ("https://shop.example/c/audio") — a CMS-authored navigation commonly
 * stores the latter, and rejecting those would make whole sections of the site
 * invisible to the sitemap with no error anywhere.
 *
 * @param siteOrigin - Site origin used to tell our own absolute URLs from foreign ones.
 */
function normalizeInternalPath(
  href: string,
  siteOrigin: string | undefined
): string | null {
  let candidate = href.trim()

  // Protocol-relative ("//cdn.example/x") starts with "/" but is external, so it
  // must be rejected before the root-relative check below treats it as a path.
  if (candidate.startsWith('//')) {
    return null
  }

  if (/^https?:\/\//i.test(candidate)) {
    if (!siteOrigin) {
      return null
    }
    try {
      const url = new URL(candidate)
      const origin = new URL(siteOrigin)
      if (url.host !== origin.host) {
        return null
      }
      candidate = `${url.pathname}${url.search}`
    } catch {
      return null
    }
  } else if (!candidate.startsWith('/')) {
    // mailto:, tel:, relative fragments — none belong in a sitemap.
    return null
  }

  const path = stripLocalePrefix(candidate.split(/[?#]/)[0] ?? '')
  return path && path !== '/' ? path.replace(/\/$/, '') : null
}

/**
 * Category paths ("/c/audio") from the main navigation, walking all nesting
 * levels. The navigation is the only catalog-wide category listing the BFF
 * exposes, so it doubles as the sitemap's category source.
 */
export function collectCategoryPaths(
  navigation: MainNavigationResponse | null,
  siteOrigin?: string
): string[] {
  return [
    ...walkCategoryPaths(
      navigation?.items as NavigationItem[],
      true,
      siteOrigin
    ),
  ]
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
  includeSubcategories: boolean,
  siteOrigin?: string
): string[] {
  return [
    ...walkCategoryPaths(
      navigation?.items as NavigationItem[],
      includeSubcategories,
      siteOrigin
    ),
  ]
}

function walkCategoryPaths(
  items: NavigationItem[] | undefined,
  descend: boolean,
  siteOrigin: string | undefined
): Set<string> {
  const paths = new Set<string>()

  const walk = (level: NavigationItem[] | undefined) => {
    for (const item of level ?? []) {
      const path = normalizeInternalPath(item.href, siteOrigin)
      const isCategory = path !== null && isCategoryPath(path)
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
export function collectContentPaths(
  footer: FooterResponse | null,
  siteOrigin?: string
): string[] {
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
    const path = normalizeInternalPath(link.url, siteOrigin)
    if (
      path &&
      !isCategoryPath(path) &&
      !isProductPath(path) &&
      !isNonIndexablePath(path)
    ) {
      paths.add(path)
    }
  }
  return [...paths]
}
