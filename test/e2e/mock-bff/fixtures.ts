/**
 * Canned BFF response fixtures for e2e tests.
 *
 * Fixtures are keyed on the X-Data-Source header value so the mock BFF can
 * return distinguishable responses per variant, making header-correctness
 * observable via content (not just via the /__requests inspection endpoint).
 *
 * Slug catalogs deliberately diverge between data sources so that the
 * locale-switch variant produces a wrong/fallback URL when the variant context is
 * can catch.
 *
 * Default catalog:  product  en="blue-shirt"  de="blaues-hemd"
 *                   category en="mens-shirts"  de="herrenhemden"
 * Alt catalog:      product  en="red-shoes"   de="rote-schuhe"   (NOT in default)
 *                   category en="summer-sale"  de="sommerschlussverkauf" (NOT in default)
 *
 * Probe catalog:    ANY slug starting with "probe-" is served for ALL data sources
 *                   and all draft states.  Product/collection names embed the data
 *                   source + draft state so content-level assertions are still possible.
 *                   These slugs are used by specs that need cold, unique URLs with no
 *                   cross-test ISR cache pollution.
 */

export const DEFAULT_SOURCE = 'commercetools-set'
export const ALT_SOURCE = 'commercetools-algolia-set'

// ─── Shared (source-agnostic) ────────────────────────────────────────────────

export const NAVIGATION_FIXTURE = {
  items: [
    // "Shop" → content page; used in variant-navigation nav-click test
    { text: 'Shop', href: '/en/c/probe-var-nav-dest' },
    // "About" → stable content page for non-navigation tests
    { text: 'About', href: '/en/about-us' },
  ],
}

export const HEADER_FIXTURE = { topBarMessages: ['Free shipping over €50'] }

export const FOOTER_FIXTURE = { sections: [], legalLinks: [] }

export const STORE_CONFIG_FIXTURE = {
  shippingCountries: ['DE', 'AT'],
  projectCountries: ['DE', 'AT'],
}

// ─── Product card helper ──────────────────────────────────────────────────────

function makeProductCard(id: string, name: string, slug: string) {
  return {
    id,
    name,
    slug,
    image: { src: 'https://placehold.co/400x400', alt: name },
    price: { regularPriceInCents: 1999, currency: 'EUR' },
  }
}

// ─── Probe catalog ────────────────────────────────────────────────────────────
// Any slug starting with "probe-" gets a generated fixture keyed on the data
// source and draft flag so tests can still assert content-level variant divergence.

export function makeProbeProduct(slug: string, dataSource: string, draft = false) {
  const label = draft ? `DRAFT:${dataSource}` : dataSource
  return {
    breadcrumb: [{ label: dataSource, path: `/p/${slug}` }],
    product: {
      id: `probe-${slug}`,
      name: `${label} — ${slug}`,
      slug,
      price: { regularPriceInCents: 999, currency: 'EUR' },
      gallery: { images: [{ src: 'https://placehold.co/400x400', alt: slug }] },
      description: `Probe product for ${dataSource}`,
      slugByLocale: { 'en-US': slug, 'de-DE': `de-${slug}` },
    },
  }
}

export function makeProbeCollection(slug: string, dataSource: string, draft = false) {
  const label = draft ? `DRAFT:${dataSource}` : dataSource
  const item1 = makeProductCard(`${slug}-item-1`, `${label} — ${slug} item 1`, `${slug}-item-1`)
  const item2 = makeProductCard(`${slug}-item-2`, `${label} — ${slug} item 2`, `${slug}-item-2`)
  return {
    breadcrumb: [{ label: dataSource, path: `/c/${slug}` }],
    productList: [item1, item2],
    total: 2,
    categoryName: `${label} — ${slug}`,
    slugByLocale: { 'en-US': slug, 'de-DE': `de-${slug}` },
  }
}

export function makeProbeContentPage(slug: string, draft = false) {
  const label = draft ? `DRAFT:probe` : 'probe'
  return {
    breadcrumb: [{ label: 'probe', path: `/${slug}` }],
    slug,
    pageTitle: `${label} — ${slug}`,
    slugByLocale: { 'en-US': slug, 'de-DE': `de-${slug}` },
    components: [],
  }
}

// ─── Products ────────────────────────────────────────────────────────────────

function makeProduct(
  id: string,
  name: string,
  slug: string,
  slugByLocale: Record<string, string>,
  draft = false
) {
  return {
    breadcrumb: [{ label: name, path: `/p/${slug}` }],
    product: {
      id,
      name: draft ? `DRAFT: ${name}` : name,
      slug,
      price: { regularPriceInCents: 4999, currency: 'EUR' },
      gallery: { images: [{ src: 'https://placehold.co/400x400', alt: name }] },
      description: `${slug} — ${draft ? 'draft' : 'live'} description`,
      slugByLocale,
    },
  }
}

// Default catalog products (keyed by slug, locale-agnostic lookup)
export const DEFAULT_PRODUCTS: Record<string, object> = {
  'blue-shirt': makeProduct(
    'p-001',
    'Blue Shirt',
    'blue-shirt',
    { 'en-US': 'blue-shirt', 'de-DE': 'blaues-hemd' }
  ),
  'blaues-hemd': makeProduct(
    'p-001',
    'Blaues Hemd',
    'blaues-hemd',
    { 'en-US': 'blue-shirt', 'de-DE': 'blaues-hemd' }
  ),
}

export const DEFAULT_PRODUCTS_DRAFT: Record<string, object> = {
  'blue-shirt': makeProduct(
    'p-001',
    'Blue Shirt',
    'blue-shirt',
    { 'en-US': 'blue-shirt', 'de-DE': 'blaues-hemd' },
    true
  ),
  'blaues-hemd': makeProduct(
    'p-001',
    'Blaues Hemd',
    'blaues-hemd',
    { 'en-US': 'blue-shirt', 'de-DE': 'blaues-hemd' },
    true
  ),
}

export const ALT_PRODUCTS_DRAFT: Record<string, object> = {
  'red-shoes': makeProduct(
    'p-002',
    'Red Shoes',
    'red-shoes',
    { 'en-US': 'red-shoes', 'de-DE': 'rote-schuhe' },
    true
  ),
  'rote-schuhe': makeProduct(
    'p-002',
    'Rote Schuhe',
    'rote-schuhe',
    { 'en-US': 'red-shoes', 'de-DE': 'rote-schuhe' },
    true
  ),
}

// Alt catalog products (only exist in alt catalog, NOT in default)
export const ALT_PRODUCTS: Record<string, object> = {
  'red-shoes': makeProduct(
    'p-002',
    'Red Shoes',
    'red-shoes',
    { 'en-US': 'red-shoes', 'de-DE': 'rote-schuhe' }
  ),
  'rote-schuhe': makeProduct(
    'p-002',
    'Rote Schuhe',
    'rote-schuhe',
    { 'en-US': 'red-shoes', 'de-DE': 'rote-schuhe' }
  ),
}

// ─── Product collections ──────────────────────────────────────────────────────

function makeCollection(
  slug: string,
  name: string,
  slugByLocale: Record<string, string>,
  draft = false,
  products: ReturnType<typeof makeProductCard>[] = []
) {
  return {
    breadcrumb: [{ label: name, path: `/c/${slug}` }],
    productList: products,
    total: products.length,
    categoryName: draft ? `DRAFT: ${name}` : name,
    slugByLocale,
  }
}

const BLUE_SHIRT_CARD = makeProductCard('p-001', 'Blue Shirt', 'blue-shirt')
const BLAUES_HEMD_CARD = makeProductCard('p-001', 'Blaues Hemd', 'blaues-hemd')
const RED_SHOES_CARD = makeProductCard('p-002', 'Red Shoes', 'red-shoes')
const ROTE_SCHUHE_CARD = makeProductCard('p-002', 'Rote Schuhe', 'rote-schuhe')

export const DEFAULT_COLLECTIONS: Record<string, object> = {
  'mens-shirts': makeCollection(
    'mens-shirts',
    "Men's Shirts",
    { 'en-US': 'mens-shirts', 'de-DE': 'herrenhemden' },
    false,
    [BLUE_SHIRT_CARD]
  ),
  herrenhemden: makeCollection(
    'herrenhemden',
    'Herrenhemden',
    { 'en-US': 'mens-shirts', 'de-DE': 'herrenhemden' },
    false,
    [BLAUES_HEMD_CARD]
  ),
}

export const DEFAULT_COLLECTIONS_DRAFT: Record<string, object> = {
  'mens-shirts': makeCollection(
    'mens-shirts',
    "Men's Shirts",
    { 'en-US': 'mens-shirts', 'de-DE': 'herrenhemden' },
    true,
    [BLUE_SHIRT_CARD]
  ),
}

export const ALT_COLLECTIONS_DRAFT: Record<string, object> = {
  'summer-sale': makeCollection(
    'summer-sale',
    'Summer Sale',
    { 'en-US': 'summer-sale', 'de-DE': 'sommerschlussverkauf' },
    true,
    [RED_SHOES_CARD]
  ),
  sommerschlussverkauf: makeCollection(
    'sommerschlussverkauf',
    'Sommerschlussverkauf',
    { 'en-US': 'summer-sale', 'de-DE': 'sommerschlussverkauf' },
    true,
    [ROTE_SCHUHE_CARD]
  ),
}

export const ALT_COLLECTIONS: Record<string, object> = {
  'summer-sale': makeCollection(
    'summer-sale',
    'Summer Sale',
    { 'en-US': 'summer-sale', 'de-DE': 'sommerschlussverkauf' },
    false,
    [RED_SHOES_CARD]
  ),
  sommerschlussverkauf: makeCollection(
    'sommerschlussverkauf',
    'Sommerschlussverkauf',
    { 'en-US': 'summer-sale', 'de-DE': 'sommerschlussverkauf' },
    false,
    [ROTE_SCHUHE_CARD]
  ),
}

// ─── Content pages ────────────────────────────────────────────────────────────

function makeContentPage(
  slug: string,
  title: string,
  slugByLocale: Record<string, string>,
  draft = false
) {
  return {
    breadcrumb: [{ label: title, path: `/${slug}` }],
    slug,
    pageTitle: draft ? `DRAFT: ${title}` : title,
    slugByLocale,
    components: [],
  }
}

// Content pages are shared across data sources (CMS is not per-variant)
export const CONTENT_PAGES: Record<string, object> = {
  homepage: makeContentPage('homepage', 'Home', { 'en-US': 'homepage', 'de-DE': 'startseite' }),
  startseite: makeContentPage('startseite', 'Startseite', { 'en-US': 'homepage', 'de-DE': 'startseite' }),
  'about-us': makeContentPage('about-us', 'About Us', { 'en-US': 'about-us', 'de-DE': 'ueber-uns' }),
  'ueber-uns': makeContentPage('ueber-uns', 'Über Uns', { 'en-US': 'about-us', 'de-DE': 'ueber-uns' }),
  contact: makeContentPage('contact', 'Contact', { 'en-US': 'contact', 'de-DE': 'kontakt' }),
  kontakt: makeContentPage('kontakt', 'Kontakt', { 'en-US': 'contact', 'de-DE': 'kontakt' }),
}

export const CONTENT_PAGES_DRAFT: Record<string, object> = {
  homepage: makeContentPage('homepage', 'Home', { 'en-US': 'homepage', 'de-DE': 'startseite' }, true),
  startseite: makeContentPage('startseite', 'Startseite', { 'en-US': 'homepage', 'de-DE': 'startseite' }, true),
  'about-us': makeContentPage('about-us', 'About Us', { 'en-US': 'about-us', 'de-DE': 'ueber-uns' }, true),
  'ueber-uns': makeContentPage('ueber-uns', 'Über Uns', { 'en-US': 'about-us', 'de-DE': 'ueber-uns' }, true),
  contact: makeContentPage('contact', 'Contact', { 'en-US': 'contact', 'de-DE': 'kontakt' }, true),
  kontakt: makeContentPage('kontakt', 'Kontakt', { 'en-US': 'contact', 'de-DE': 'kontakt' }, true),
}
