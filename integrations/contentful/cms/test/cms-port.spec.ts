/**
 * The Contentful cms port, built from its own Nest providers as the BFF builds it: the options the BFF
 * hands over (space, environment, tokens) reach the GraphQL client, the delivery token is used by default,
 * the preview token only for preview and never a fallback, and a page comes back as the contract's
 * ContentPageResponse. The GraphQL client is replaced by an in-memory fake; no network.
 */
import { Test } from '@nestjs/testing'
import { PinoLogger } from 'nestjs-pino'
import { PortOptions, RequestContext, type Port } from '@core/integration-kit'
import { contentful } from '../src/shopin'
import { GRAPHQL_CLIENT } from '../src/client/graphql-client.tokens'

const OPTIONS = {
  space: 'space-1',
  environment: 'master',
  accessToken: 'delivery-token',
}

interface Call {
  query: string
  variables: Record<string, unknown>
  authorization: string
}

/** Answers the page-by-slug query with one page; records every request. */
class FakeGraphQLClient {
  calls: Call[] = []
  async request(
    document: unknown,
    variables: Record<string, unknown>,
    headers: { authorization: string }
  ) {
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

async function cmsPort(
  options: Record<string, string | undefined>,
  client?: FakeGraphQLClient
) {
  const definition = contentful().ports.cms()
  expect(definition.category).toBe('cms')
  let builder = Test.createTestingModule({
    providers: [
      ...(definition.providers as never[]),
      { provide: PortOptions, useValue: Object.freeze({ ...options }) },
      // the BFF provides it globally
      { provide: RequestContext, useValue: {} },
      { provide: PinoLogger, useValue: quietLogger },
      {
        provide: PORT,
        inject: (definition.inject ?? []) as never[],
        useFactory: definition.useFactory,
      },
    ],
  })
  if (client)
    builder = builder.overrideProvider(GRAPHQL_CLIENT).useValue(client)
  const module = await builder.compile()
  return { port: module.get<Port<'cms'>>(PORT), module }
}

describe('Contentful cms port', () => {
  it('serves pages and layout; a page is fetched with the delivery token', async () => {
    const client = new FakeGraphQLClient()
    const { port } = await cmsPort(OPTIONS, client)
    expect(Object.keys(port).sort()).toEqual(['layoutService', 'pageService'])
    const page = await port.pageService.getPage('about', 'en-US', false)
    expect(page).toMatchObject({ slug: 'about', pageTitle: 'Contentful about' })
    expect(client.calls[0]).toMatchObject({
      variables: { slug: 'about', locale: 'en-US', preview: false },
      authorization: 'Bearer delivery-token',
    })
    expect(
      client.calls.every((c) => c.authorization === 'Bearer delivery-token')
    ).toBe(true)
  })

  it('preview uses the preview token', async () => {
    const client = new FakeGraphQLClient()
    const { port } = await cmsPort(
      { ...OPTIONS, previewAccessToken: 'preview-token' },
      client
    )
    await port.pageService.getPage('about', 'en-US', true)
    expect(client.calls[0]).toMatchObject({
      variables: { preview: true },
      authorization: 'Bearer preview-token',
    })
  })

  it('preview without a preview token is refused (503) before any request; never the delivery token', async () => {
    const client = new FakeGraphQLClient()
    const { port } = await cmsPort(OPTIONS, client)
    await expect(
      port.pageService.getPage('about', 'en-US', true)
    ).rejects.toMatchObject({ status: 503 })
    expect(client.calls).toEqual([])
  })

  it('the GraphQL client is built from the options: space and environment in the endpoint', async () => {
    const { module } = await cmsPort({
      ...OPTIONS,
      space: 'other-space',
      environment: 'staging',
    })
    const client = module.get<{ url: string }>(GRAPHQL_CLIENT)
    expect(client.url).toBe(
      'https://graphql.contentful.com/content/v1/spaces/other-space/environments/staging'
    )
  })
})

describe('Contentful descriptor', () => {
  it('declares its cms variables (preview token optional) and its image host', () => {
    const { env, storefront } = contentful()
    expect(env).toEqual({
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
    expect(storefront!.contentImages!.hosts).toContain('images.ctfassets.net')
  })
})

describe('Contentful credentials check at start', () => {
  const real = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = real
  })

  it('an unreachable host: names it, and the network (the host is fixed, no variable sets it), never a bare "fetch failed"', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('fetch failed', {
        cause: Object.assign(new Error('getaddrinfo ENOTFOUND'), {
          code: 'ENOTFOUND',
        }),
      })
    }) as typeof fetch
    const definition = contentful().ports.cms()
    await expect(
      definition.probe!({} as never, OPTIONS as never)
    ).rejects.toThrow(
      /^graphql\.contentful\.com cannot be reached \(the vendor's fixed host: check this machine's network or proxy\): ENOTFOUND$/
    )
  })

  it('a refused token names CONTENTFUL_ACCESS_TOKEN', async () => {
    globalThis.fetch = (async () =>
      new Response('', { status: 401 })) as typeof fetch
    const definition = contentful().ports.cms()
    await expect(
      definition.probe!({} as never, OPTIONS as never)
    ).rejects.toThrow(
      /refused the credentials \(CONTENTFUL_ACCESS_TOKEN\): HTTP 401/
    )
  })
})
