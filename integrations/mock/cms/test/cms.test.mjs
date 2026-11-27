/**
 * Mock CMS: its descriptor serves cms only (a part of mock data, id `mock`), its port returns the page and layout
 * services, and those serve valid pages (their own and a default one), header and footer.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ContentPageResponseSchema } from '@core/contracts/content/page'
import {
  FooterResponseSchema,
  HeaderResponseSchema,
} from '@core/contracts/content/layout'
import descriptor from '../dist/shopin.js'
import cms from '../dist/parts/cms.js'
import { PageService, LayoutService } from '../dist/index.js'

test('the descriptor serves cms only, under the id of mock data', () => {
  const part = descriptor.mockCms()
  assert.equal(part.id, 'mock')
  assert.deepEqual(Object.keys(part.ports), ['cms'])
  assert.equal(part.ports.cms().category, 'cms')
})

test('the port factory returns the page and layout services under the port keys', () => {
  const pageService = {}
  const layoutService = {}
  const result = cms.default.useFactory(pageService, layoutService)
  assert.equal(result.pageService, pageService)
  assert.equal(result.layoutService, layoutService)
})

for (const [slug, title] of [
  ['homepage', 'Hero slider'],
  ['about', 'Our team'],
  ['support', 'FAQ'],
]) {
  test(`serves its own ${slug} page as a valid content page`, async () => {
    const page = await new PageService().getPage(slug)
    ContentPageResponseSchema.parse(page)
    assert.ok(JSON.stringify(page).includes(`"title":"${title}"`))
  })
}

test('serves a default content page for any other slug, under that slug', async () => {
  const page = await new PageService().getPage('any-other-page')
  ContentPageResponseSchema.parse(page)
  assert.equal(page.slug, 'any-other-page')
  assert.ok(!JSON.stringify(page).includes('"title":"Hero slider"'))
})

test('serves a valid header and footer', async () => {
  const layout = new LayoutService()
  HeaderResponseSchema.parse(await layout.getHeader())
  FooterResponseSchema.parse(await layout.getFooter())
})

/** Every image (an object with `url` and `alt`) in a value, at any depth. */
function images(value, found = []) {
  if (Array.isArray(value)) {
    value.forEach((v) => images(v, found))
  } else if (value && typeof value === 'object') {
    if (typeof value.url === 'string' && 'alt' in value) {
      found.push(value.url)
    }
    Object.values(value).forEach((v) => images(v, found))
  }
  return found
}

test('every image host the sample pages use is declared, so the storefront resizes and preconnects it (criterion 20)', async () => {
  const sources = [descriptor.mockCms().storefront.contentImages].flat()
  const sourceOf = (url) => {
    const host = new URL(url).hostname
    return sources.find((s) =>
      s.hosts.some((h) => host === h || host.endsWith(`.${h}`))
    )
  }
  const pages = await Promise.all(
    ['homepage', 'about', 'support', 'any-other-page'].map((slug) =>
      new PageService().getPage(slug)
    )
  )
  const layout = new LayoutService()
  const urls = images([
    pages,
    await layout.getHeader(),
    await layout.getFooter(),
  ]).filter((url) => /^https?:\/\//.test(url))
  assert.ok(urls.length > 0)
  assert.deepEqual(
    urls.filter((url) => !sourceOf(url)),
    [],
    'image hosts the descriptor does not declare'
  )
  // the hero image's host is an image API: resized by query, as before the integrations moved out of the storefront
  const hero = urls.find((url) => url.includes('cloudfront.net'))
  assert.deepEqual(sourceOf(hero).resize, {
    kind: 'query',
    width: 'w',
    quality: 'q',
    fixed: { fm: 'webp' },
  })
})
