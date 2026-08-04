/**
 * Catalog URL shape, in one place.
 *
 * These prefixes are used on both sides of the stack — integrations emit them in
 * navigation hrefs and breadcrumb paths, the presentation layer builds links,
 * canonicals and sitemap URLs from them, and sitemap discovery *recognises*
 * categories by them. Hardcoding the strings per call site meant a client
 * relocalising their URLs (e.g. /produkt/, /kategorie/) had to find every one, and
 * anything missed failed silently: unrecognised links simply vanish from the sitemap.
 *
 * IMPORTANT: the App Router directories that serve these paths
 * (app/[variant]/[locale]/(main)/p, .../c) are filesystem names and cannot read
 * constants. Renaming a prefix here means renaming that directory to match.
 */

/** URL path prefix of product detail pages, e.g. /p/red-shoes. */
export const PRODUCT_PATH_PREFIX = '/p'

/** URL path prefix of category (product collection) pages, e.g. /c/audio. */
export const CATEGORY_PATH_PREFIX = '/c'

/** Locale-less product path for a slug, e.g. "red-shoes" → "/p/red-shoes". */
export function buildProductPath(slug: string): string {
  return `${PRODUCT_PATH_PREFIX}/${slug}`
}

/** Locale-less category path for a slug, e.g. "audio" → "/c/audio". */
export function buildCategoryPath(slug: string): string {
  return `${CATEGORY_PATH_PREFIX}/${slug}`
}

/** True when a locale-less path points at a product detail page. */
export function isProductPath(path: string): boolean {
  return path.startsWith(`${PRODUCT_PATH_PREFIX}/`)
}

/** True when a locale-less path points at a category page. */
export function isCategoryPath(path: string): boolean {
  return path.startsWith(`${CATEGORY_PATH_PREFIX}/`)
}

/** Slug of a product path, or null when it is not one ("/p/red-shoes" → "red-shoes"). */
export function getProductSlugFromPath(path: string): string | null {
  return isProductPath(path) ? path.slice(PRODUCT_PATH_PREFIX.length + 1) : null
}

/** Slug of a category path, or null when it is not one ("/c/audio" → "audio"). */
export function getCategorySlugFromPath(path: string): string | null {
  return isCategoryPath(path)
    ? path.slice(CATEGORY_PATH_PREFIX.length + 1)
    : null
}
