/**
 * The Contentful cms port, built from its own Nest providers as the BFF builds it: the options the BFF
 * hands over (space, environment, tokens) reach the GraphQL client, the delivery token is used by default,
 * the preview token only for preview and never a fallback, and a page comes back as the contract's
 * ContentPageResponse. The GraphQL client is replaced by an in-memory fake; no network.
 */
import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import nestTesting from '@nestjs/testing'
import nestjsPino from 'nestjs-pino'
import integrationKit from '@core/integration-kit'
import shopin from '../dist/shopin.js'
import tokens from '../dist/client/graphql-client.tokens.js'

const { Test } = nestTesting
const { PinoLogger } = nestjsPino
const { PortOptions, RequestContext } = integrationKit
const { contentful } = shopin
const { GRAPHQL_CLIENT } = tokens

const OPTIONS = {
  space: 'space-1',
  environment: 'master',
  accessToken: 'delivery-token',
}

/** Answers the page-by-slug query with one page; records every request. */
class FakeGraphQLClient {
  calls = []
  async request(document, variables, headers) {
    const query = String(document)
    this.calls.push({ query, variables, authorization: headers.authorization })
    if (/pageCollection/.test(query))
      return {
        pageCollection: {
          items: [
            {
              slug: variables['slug'],
              pageTitle: `Contentful ${variables['slug']}`,
              componentsCollection: { items: [] },
            },
          ],
        },
      }
    return {}
  }
}

const PORT = Symbol('contentful cms port')
const quietLogger = {
  setContext() {},
  debug() {},
  info() {},
  warn() {},
  error() {},
}

async function cmsPort(options, client) {
  const definition = contentful().ports.cms()
  assert.equal(definition.category, 'cms')
  let builder = Test.createTestingModule({
    providers: [
      ...definition.providers,
      { provide: PortOptions, useValue: Object.freeze({ ...options }) },
      // the BFF provides it globally
      { provide: RequestContext, useValue: {} },
      { provide: PinoLogger, useValue: quietLogger },
      {
        provide: PORT,
        inject: definition.inject ?? [],
        useFactory: definition.useFactory,
      },
    ],
  })
  if (client)
    builder = builder.overrideProvider(GRAPHQL_CLIENT).useValue(client)
  const module = await builder.compile()
  return { port: module.get(PORT), module }
}

describe('Contentful cms port', () => {
  it('serves pages and layout; a page is fetched with the delivery token', async () => {
    const client = new FakeGraphQLClient()
    const { port } = await cmsPort(OPTIONS, client)
    assert.deepEqual(Object.keys(port).sort(), ['layoutService', 'pageService'])
    const page = await port.pageService.getPage('about', 'en-US', false)
    assert.equal(page.slug, 'about')
    assert.equal(page.pageTitle, 'Contentful about')
    assert.equal(client.calls[0].variables.slug, 'about')
    assert.equal(client.calls[0].variables.locale, 'en-US')
    assert.equal(client.calls[0].variables.preview, false)
    assert.equal(client.calls[0].authorization, 'Bearer delivery-token')
    assert.equal(
      client.calls.every((c) => c.authorization === 'Bearer delivery-token'),
      true
    )
  })

  it('preview uses the preview token', async () => {
    const client = new FakeGraphQLClient()
    const { port } = await cmsPort(
      { ...OPTIONS, previewAccessToken: 'preview-token' },
      client
    )
    await port.pageService.getPage('about', 'en-US', true)
    assert.equal(client.calls[0].variables.preview, true)
    assert.equal(client.calls[0].authorization, 'Bearer preview-token')
  })

  it('preview without a preview token is refused (503) before any request; never the delivery token', async () => {
    const client = new FakeGraphQLClient()
    const { port } = await cmsPort(OPTIONS, client)
    await assert.rejects(port.pageService.getPage('about', 'en-US', true), {
      status: 503,
    })
    assert.deepEqual(client.calls, [])
  })

  it('the GraphQL client is built from the options: space and environment in the endpoint', async () => {
    const { module } = await cmsPort({
      ...OPTIONS,
      space: 'other-space',
      environment: 'staging',
    })
    const client = module.get(GRAPHQL_CLIENT)
    assert.equal(
      client.url,
      'https://graphql.contentful.com/content/v1/spaces/other-space/environments/staging'
    )
  })
})

describe('Contentful descriptor', () => {
  it('declares its cms variables (preview token optional) and its image host', () => {
    const { env, storefront } = contentful()
    assert.deepEqual(env, {
      cms: {
        space: { env: 'CONTENTFUL_SPACE' },
        environment: { env: 'CONTENTFUL_ENVIRONMENT', default: 'master' },
        accessToken: { env: 'CONTENTFUL_ACCESS_TOKEN' },
        previewAccessToken: {
          env: 'CONTENTFUL_PREVIEW_ACCESS_TOKEN',
          optional: true,
        },
      },
    })
    assert.ok(storefront.contentImages.hosts.includes('images.ctfassets.net'))
  })
})

describe('Contentful credentials check at start', () => {
  const real = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = real
  })

  it('an unreachable host: names it, and the network (the host is fixed, no variable sets it), never a bare "fetch failed"', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('fetch failed', {
        cause: Object.assign(new Error('getaddrinfo ENOTFOUND'), {
          code: 'ENOTFOUND',
        }),
      })
    }
    const definition = contentful().ports.cms()
    await assert.rejects(definition.probe({}, OPTIONS), {
      message:
        /^graphql\.contentful\.com cannot be reached \(the vendor's fixed host: check this machine's network or proxy\): ENOTFOUND$/,
    })
  })

  it('a refused token names CONTENTFUL_ACCESS_TOKEN', async () => {
    globalThis.fetch = async () => new Response('', { status: 401 })
    const definition = contentful().ports.cms()
    await assert.rejects(definition.probe({}, OPTIONS), {
      message: /refused the credentials \(CONTENTFUL_ACCESS_TOKEN\): HTTP 401/,
    })
  })
})
