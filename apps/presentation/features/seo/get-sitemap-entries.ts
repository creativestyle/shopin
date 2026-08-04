import type { MetadataRoute } from 'next'
import {
  buildProductPath,
  getCategorySlugFromPath,
  listLocales,
  SITEMAP_CATEGORY_CONCURRENCY,
  SITEMAP_COLLECTION_PAGE_SIZE,
  SITEMAP_DISCOVER_SUBCATEGORY_PRODUCTS,
  SITEMAP_MAX_URLS,
  SITEMAP_REVALIDATE_SECONDS,
} from '@config/constants'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { getBffCacheOptions } from '@/lib/bff/bff-cache-options'
import { buildCanonicalUrl } from '@/lib/site-url'
import { logger } from '@/lib/logger'
import { SitemapService } from './lib/sitemap-service'
import {
  collectCategoryPaths,
  collectContentPaths,
  collectProductDiscoveryPaths,
} from './lib/collect-sitemap-paths'

/** Relative crawl priorities. Advisory only — search engines may ignore them. */
const PRIORITY = {
  home: 1,
  category: 0.8,
  product: 0.6,
  content: 0.5,
} as const

/**
 * Every indexable URL of the storefront, for all locales.
 *
 * Discovery works with the endpoints the BFF actually exposes:
 *  - categories come from the main navigation (there is no category-list endpoint),
 *  - products are enumerated by paging category collections,
 *  - CMS pages come from footer links (the content API has no page-list endpoint).
 * Adding a "list slugs" endpoint per data source would make this exhaustive; until
 * then, anything not linked from navigation or footer is not discoverable here.
 *
 * Scale is bounded on both axes: the sitemaps.org URL limit is split evenly
 * between locales (so truncation can never silently drop a whole language), and
 * product enumeration runs with bounded concurrency against as few categories as
 * the data source's category semantics allow.
 *
 * `lastModified` is intentionally omitted: no contract carries a modification date,
 * and a made-up timestamp on every URL teaches crawlers to distrust the signal.
 */
export async function getSitemapEntries(
  baseUrl: string
): Promise<MetadataRoute.Sitemap> {
  const locales = listLocales()
  const localeCount = Math.max(locales.length, 1)
  const urlBudgetPerLocale = Math.floor(SITEMAP_MAX_URLS / localeCount)
  // Locales are walked in parallel, so the concurrency cap is divided between them:
  // SITEMAP_CATEGORY_CONCURRENCY stays a bound on the whole regeneration rather than
  // one that multiplies with every locale added to the storefront.
  const concurrencyPerLocale = Math.max(
    1,
    Math.floor(SITEMAP_CATEGORY_CONCURRENCY / localeCount)
  )

  const perLocale = await Promise.all(
    locales.map(({ urlPrefix }) =>
      collectLocaleEntries(
        baseUrl,
        urlPrefix,
        urlBudgetPerLocale,
        concurrencyPerLocale
      )
    )
  )

  return perLocale.flat()
}

async function collectLocaleEntries(
  baseUrl: string,
  urlPrefix: string,
  urlBudget: number,
  concurrency: number
): Promise<MetadataRoute.Sitemap> {
  const cacheOptions = getBffCacheOptions(SITEMAP_REVALIDATE_SECONDS)
  const url = (...pathSegments: string[]) =>
    buildCanonicalUrl(baseUrl, urlPrefix, ...pathSegments)

  let service: SitemapService
  try {
    // Locale override: sitemap generation runs outside a [variant]/[locale] render,
    // so there is no next-intl context to read the locale from. No variant headers
    // are set either, which makes the BFF serve the default data source — the same
    // one clean public URLs resolve to.
    service = new SitemapService(
      await createBffFetchServer({ locale: urlPrefix })
    )
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Sitemap: BFF client unavailable; emitting homepage only'
    )
    return [{ url: url(), priority: PRIORITY.home }]
  }

  const [navigation, footer] = await Promise.all([
    service.getNavigation(cacheOptions),
    service.getFooter(cacheOptions),
  ])

  const categoryPaths = collectCategoryPaths(navigation, baseUrl)
  const contentPaths = collectContentPaths(footer, baseUrl)

  // Zero categories means discovery found nothing to walk, so the sitemap will
  // contain little more than the homepage. That is almost always a wiring problem
  // rather than a real storefront — categories missing from the main navigation, or
  // navigation hrefs that no longer match CATEGORY_PATH_PREFIX after a URL rename.
  // Say so loudly: a short sitemap is otherwise indistinguishable from a correct one.
  if (categoryPaths.length === 0) {
    logger.warn(
      { urlPrefix, navigationItems: navigation?.items.length ?? 0 },
      'Sitemap: no category URLs discovered — check that main navigation links to categories and that its hrefs use the configured catalog route prefixes'
    )
  }

  // Static and link-derived URLs are cheap and known up front, so they claim
  // their share of the budget first; products get whatever is left.
  const entries: MetadataRoute.Sitemap = [
    {
      url: url(),
      priority: PRIORITY.home,
      changeFrequency: 'daily' as const,
    },
    ...categoryPaths.map((path) => ({
      url: url(path),
      priority: PRIORITY.category,
      changeFrequency: 'daily' as const,
    })),
    ...contentPaths.map((path) => ({
      url: url(path),
      priority: PRIORITY.content,
      changeFrequency: 'monthly' as const,
    })),
  ].slice(0, urlBudget)

  const productSlugs = await collectProductSlugs({
    service,
    categoryPaths: collectProductDiscoveryPaths(
      navigation,
      SITEMAP_DISCOVER_SUBCATEGORY_PRODUCTS,
      baseUrl
    ),
    cacheOptions,
    urlBudget: urlBudget - entries.length,
    urlPrefix,
    concurrency,
  })

  // Same reasoning as the category warning: a catalog that yields no product URLs
  // points at a broken assumption (route prefixes, or a data source that scopes
  // collections to the exact category — see SITEMAP_DISCOVER_SUBCATEGORY_PRODUCTS),
  // not at an empty shop.
  if (categoryPaths.length > 0 && productSlugs.length === 0) {
    logger.warn(
      { urlPrefix, categories: categoryPaths.length },
      'Sitemap: categories found but no product URLs — verify the collection endpoint and SITEMAP_DISCOVER_SUBCATEGORY_PRODUCTS for this data source'
    )
  }

  return [
    ...entries,
    ...productSlugs.map((slug) => ({
      url: url(buildProductPath(slug)),
      priority: PRIORITY.product,
      changeFrequency: 'weekly' as const,
    })),
  ]
}

interface CollectProductSlugsParams {
  service: SitemapService
  categoryPaths: string[]
  cacheOptions: ReturnType<typeof getBffCacheOptions>
  urlBudget: number
  urlPrefix: string
  concurrency: number
}

/**
 * Product slugs behind the given categories, deduplicated (the same product is
 * reachable through several categories) and capped at `urlBudget`.
 *
 * Categories are fetched `concurrency` at a time so wall-clock grows with
 * catalog/concurrency rather than with catalog size alone, and the walk stops as
 * soon as the budget is exhausted.
 */
async function collectProductSlugs({
  service,
  categoryPaths,
  cacheOptions,
  urlBudget,
  urlPrefix,
  concurrency,
}: CollectProductSlugsParams): Promise<string[]> {
  if (urlBudget <= 0) {
    logger.warn(
      { urlPrefix, limit: SITEMAP_MAX_URLS },
      'Sitemap: URL budget exhausted before product enumeration; split the sitemap with generateSitemaps()'
    )
    return []
  }

  const slugs = new Set<string>()

  for (let index = 0; index < categoryPaths.length; index += concurrency) {
    const batch = categoryPaths.slice(index, index + concurrency)
    const batches = await Promise.all(
      batch.map((categoryPath) =>
        collectCategoryProductSlugs(
          service,
          categoryPath,
          cacheOptions,
          urlBudget
        )
      )
    )

    for (const categorySlugs of batches) {
      for (const slug of categorySlugs) {
        slugs.add(slug)
      }
    }

    if (slugs.size >= urlBudget) {
      logger.warn(
        { urlPrefix, collected: slugs.size, limit: urlBudget },
        'Sitemap: product URL budget reached; remaining categories were not enumerated'
      )
      break
    }
  }

  return [...slugs].slice(0, urlBudget)
}

/** Pages one category until its reported total is covered or the budget is met. */
async function collectCategoryProductSlugs(
  service: SitemapService,
  categoryPath: string,
  cacheOptions: ReturnType<typeof getBffCacheOptions>,
  urlBudget: number
): Promise<string[]> {
  const categorySlug = getCategorySlugFromPath(categoryPath)
  if (!categorySlug) {
    return []
  }
  const maxPages = Math.ceil(urlBudget / SITEMAP_COLLECTION_PAGE_SIZE)
  const slugs: string[] = []

  for (let page = 1; page <= maxPages; page++) {
    const collection = await service.getCollectionPage(
      categorySlug,
      page,
      SITEMAP_COLLECTION_PAGE_SIZE,
      cacheOptions
    )
    if (!collection) {
      break
    }
    for (const product of collection.productList) {
      slugs.push(product.slug)
    }
    if (
      slugs.length >= urlBudget ||
      page * SITEMAP_COLLECTION_PAGE_SIZE >= collection.total
    ) {
      break
    }
  }

  return slugs
}
