import { MAX_ITEMS_PER_PAGE } from './pagination'

/** Revalidate time for the generated sitemap.xml (crawl-facing, changes rarely). */
export const SITEMAP_REVALIDATE_SECONDS = 3600

/**
 * Page size used when enumerating products for the sitemap.
 *
 * Derived from the BFF's own maximum rather than hardcoded: the collection
 * endpoint validates `limit` against MAX_ITEMS_PER_PAGE, so a duplicated literal
 * would start failing validation — and silently drop every product URL from the
 * sitemap — as soon as that maximum were lowered.
 */
export const SITEMAP_COLLECTION_PAGE_SIZE = MAX_ITEMS_PER_PAGE

/**
 * Hard limit of URLs per sitemap file in the sitemaps.org protocol, shared
 * evenly across locales so a large catalog cannot crowd one locale out entirely.
 * Beyond this, split the sitemap with Next.js `generateSitemaps()`.
 */
export const SITEMAP_MAX_URLS = 50000

/**
 * Categories enumerated concurrently while collecting product URLs. Bounds both
 * wall-clock (the walk is otherwise strictly sequential) and the burst of
 * parallel requests the BFF sees from a single sitemap regeneration.
 */
export const SITEMAP_CATEGORY_CONCURRENCY = 6

/**
 * Whether product discovery descends into sub-categories.
 *
 * The commercetools data source resolves a category query against its entire
 * subtree (`categoriesSubTree`), so a top-level category already returns every
 * product beneath it and walking its children only re-fetches the same products —
 * roughly tripling the request count on a three-level tree for zero extra URLs.
 * Set to true only for a data source that scopes products to the exact category.
 */
export const SITEMAP_DISCOVER_SUBCATEGORY_PRODUCTS = false

/**
 * Max images embedded in a single Product JSON-LD node. Google uses only the
 * first few; an unbounded gallery would inflate every PDP's HTML payload.
 */
export const JSONLD_MAX_IMAGES = 10

/** Max description characters embedded in JSON-LD (search engines truncate well below this). */
export const JSONLD_MAX_DESCRIPTION_LENGTH = 5000
