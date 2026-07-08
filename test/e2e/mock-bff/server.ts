/**
 * Recording mock BFF for e2e tests.
 *
 * Started once in globalSetup and shared across all tests.  Every inbound
 * request is appended to a mutable `requests[]` array.
 *
 * Control endpoints (for test assertions / reset):
 *   GET  /__requests  → JSON array of recorded requests
 *   DELETE /__requests → empties the array, returns 204
 *
 * Response routing mirrors the paths used by the presentation-app services:
 *   /navigation                           NavigationService
 *   /content/header                       ContentService.getHeader
 *   /content/footer                       ContentService.getFooter
 *   /content/page/:slug                   ContentService.getContentPage
 *   /product/slug/:slug/page              ProductService.getProductPage
 *   /productCollection/slug/:slug/page    ProductCollectionService.getProductCollectionPage
 *   /store-config                         StoreConfigService.getStoreConfig
 *   /i18n/translations/:rfcLocale         I18nService.getTranslations
 *
 * Named slugs return data-source-divergent fixtures (different names/slugs per variant)
 * so tests can assert both header-level and content-level correctness.
 *
 * Probe catalog: any slug starting with "probe-" is served for ALL data sources and
 * draft states.  The fixture name echoes the data source + draft flag so specs can
 * still assert content-level variant divergence.  Use probe slugs for ISR cold-URL
 * tests so named slugs' divergence behavior is not disturbed.
 */

import http from 'node:http'
import enUS from '../../../core/i18n/en-US.json'
import deDE from '../../../core/i18n/de-DE.json'
import {
  DEFAULT_SOURCE,
  ALT_SOURCE,
  NAVIGATION_FIXTURE,
  HEADER_FIXTURE,
  FOOTER_FIXTURE,
  STORE_CONFIG_FIXTURE,
  DEFAULT_PRODUCTS,
  DEFAULT_PRODUCTS_DRAFT,
  ALT_PRODUCTS,
  ALT_PRODUCTS_DRAFT,
  DEFAULT_COLLECTIONS,
  DEFAULT_COLLECTIONS_DRAFT,
  ALT_COLLECTIONS,
  ALT_COLLECTIONS_DRAFT,
  CONTENT_PAGES,
  CONTENT_PAGES_DRAFT,
  makeProbeProduct,
  makeProbeCollection,
  makeProbeContentPage,
} from './fixtures'

export type RecordedRequest = {
  method: string
  path: string
  headers: Record<string, string>
  ts: number
}

const requests: RecordedRequest[] = []

function json(res: http.ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

function notFound(res: http.ServerResponse) {
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
}

export function createHandler(): http.RequestListener {
  return (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const pathname = url.pathname
    const method = req.method ?? 'GET'

    // ─── Control endpoints ────────────────────────────────────────────────────
    if (pathname === '/__requests') {
      if (method === 'GET') {
        return json(res, 200, requests)
      }
      if (method === 'DELETE') {
        requests.splice(0, requests.length)
        res.writeHead(204)
        res.end()
        return
      }
    }

    // Record every non-control request
    const headers: Record<string, string> = {}
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === 'string') headers[k] = v
      else if (Array.isArray(v)) headers[k] = v.join(', ')
    }
    requests.push({ method, path: pathname, headers, ts: Date.now() })

    // ─── Determine variant and draft mode ─────────────────────────────────────
    const dataSource = (req.headers['x-data-source'] as string) ?? DEFAULT_SOURCE
    const isDraft = !!req.headers['x-next-draft-mode']
    const isAlt = dataSource === ALT_SOURCE

    // ─── Route matching ───────────────────────────────────────────────────────

    // /navigation
    if (pathname === '/navigation') {
      return json(res, 200, NAVIGATION_FIXTURE)
    }

    // /content/header
    if (pathname === '/content/header') {
      return json(res, 200, HEADER_FIXTURE)
    }

    // /content/footer
    if (pathname === '/content/footer') {
      return json(res, 200, FOOTER_FIXTURE)
    }

    // /store-config
    if (pathname === '/store-config') {
      return json(res, 200, STORE_CONFIG_FIXTURE)
    }

    // /i18n/translations/:rfcLocale — serve the real i18n JSON from @core/i18n
    // so the app renders translated strings instead of raw key paths.
    if (pathname.startsWith('/i18n/translations/')) {
      const locale = pathname.slice('/i18n/translations/'.length)
      const translations = locale.startsWith('de') ? deDE : enUS
      return json(res, 200, translations)
    }

    // /content/page/:slug
    const contentMatch = pathname.match(/^\/content\/page\/(.+)$/)
    if (contentMatch) {
      const slug = decodeURIComponent(contentMatch[1])
      // Probe catalog: any probe-* slug for all sources, including locale-prefixed
      // variants (e.g. "de-probe-*").
      if (slug.startsWith('probe-') || /^[a-z]{2}-probe-/.test(slug)) {
        return json(res, 200, makeProbeContentPage(slug, isDraft))
      }
      const pages = isDraft ? CONTENT_PAGES_DRAFT : CONTENT_PAGES
      const page = pages[slug] ?? CONTENT_PAGES[slug]
      if (page) return json(res, 200, page)
      return notFound(res)
    }

    // /product/slug/:slug/page
    const productMatch = pathname.match(/^\/product\/slug\/(.+?)\/page$/)
    if (productMatch) {
      const slug = decodeURIComponent(productMatch[1])
      // Probe catalog: any probe-* slug for all sources + draft states, including
      // locale-prefixed variants (e.g. "de-probe-*" generated by makeProbeProduct's
      // slugByLocale: { 'de-DE': `de-${slug}` }).
      if (slug.startsWith('probe-') || /^[a-z]{2}-probe-/.test(slug)) {
        return json(res, 200, makeProbeProduct(slug, dataSource, isDraft))
      }
      let product: object | undefined
      if (isDraft && isAlt)  product = ALT_PRODUCTS_DRAFT[slug]
      else if (isDraft)      product = DEFAULT_PRODUCTS_DRAFT[slug]
      else if (isAlt)        product = ALT_PRODUCTS[slug]
      else                   product = DEFAULT_PRODUCTS[slug]
      if (product) return json(res, 200, product)
      return notFound(res)
    }

    // /productCollection/slug/:slug/page
    const collectionMatch = pathname.match(/^\/productCollection\/slug\/(.+?)\/page$/)
    if (collectionMatch) {
      const slug = decodeURIComponent(collectionMatch[1])
      // Probe catalog: any probe-* slug for all sources + draft states, including
      // locale-prefixed variants (e.g. "de-probe-*").
      if (slug.startsWith('probe-') || /^[a-z]{2}-probe-/.test(slug)) {
        return json(res, 200, makeProbeCollection(slug, dataSource, isDraft))
      }
      let collection: object | undefined
      if (isDraft && isAlt)  collection = ALT_COLLECTIONS_DRAFT[slug]
      else if (isDraft)      collection = DEFAULT_COLLECTIONS_DRAFT[slug]
      else if (isAlt)        collection = ALT_COLLECTIONS[slug]
      else                   collection = DEFAULT_COLLECTIONS[slug]
      if (collection) return json(res, 200, collection)
      return notFound(res)
    }

    // Unknown route
    return notFound(res)
  }
}

// Module-level singleton so globalSetup and globalTeardown share the same instance
let _server: http.Server | null = null

export function getMockBffServer(): http.Server {
  if (!_server) {
    _server = http.createServer(createHandler())
  }
  return _server
}
