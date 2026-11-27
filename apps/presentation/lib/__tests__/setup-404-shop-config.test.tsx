/**
 * @jest-environment node
 */
/**
 * Demo only in the demo (issue #345, criterion 22): on the shop config `/setup` answers 404; with the demo on, the
 * demo's Pages slot serves it. The test resolves the storefront slots as the build does (a storefront package's
 * entry, built by setup, through `@/lib/slots` and `@/lib/shop-pages`) and renders the catch-all route.
 *
 * - The active config (config/storefront; which one is on: the marker `npm run use demo` writes): shop config, no
 *   shop page takes `/setup`, the CMS is asked for it like any other slug and the route ends in notFound; demo
 *   config, the demo's setup page renders.
 * - The demo's own storefront entry (demo/storefront), loaded directly whatever config is on: its Pages slot
 *   mounts `setup`, and the same route renders it.
 * - No app route named `setup` shadows the catch-all.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const REPO = join(__dirname, '..', '..', '..', '..')
const SHOP_STOREFRONT = join(REPO, 'config', 'storefront')
const DEMO_STOREFRONT = join(REPO, 'demo', 'storefront')
/** The first line `npm run use demo` writes into the shop's files (scripts/setup.mjs DEMO_MARK). */
const DEMO_MARK = '// The SHOPin demo is on'

type Exports = Record<string, { default: string }>

/** A package entry as the build resolves it (its `exports`, the default condition). */
function entryOf(dir: string, subpath: string): string {
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
    exports: Exports
  }
  return join(dir, pkg.exports[subpath]!.default)
}

/** True when config/storefront re-exports the demo's storefront (`npm run use demo`). */
const demoIsOn = () =>
  readFileSync(join(SHOP_STOREFRONT, 'storefront.mts'), 'utf8').startsWith(
    DEMO_MARK
  )

// the CMS has no page at this slug: the BFF answers 404
const mockCms = jest.fn(async (slug: string) => {
  throw new Error(`404 Not Found (BFF GET /content/page/${slug})`)
})

type Route = {
  Page: (props: {
    params: Promise<{ variant: string; locale: string; page: string[] }>
    searchParams: Promise<Record<string, string>>
  }) => Promise<unknown>
  Pages: Readonly<Partial<Record<string, unknown>>>
}

/** The catch-all route and the slots it sees, with `storefront` (a built entry) as the shop's storefront file. */
function routeWith(storefront: string): Route {
  let route: Route | undefined
  jest.isolateModules(() => {
    jest.doMock('server-only', () => ({}))
    jest.doMock('@shopin/storefront', () => jest.requireActual(storefront))
    jest.doMock('@shopin/storefront/wired', () =>
      jest.requireActual(entryOf(SHOP_STOREFRONT, './wired'))
    )
    jest.doMock('@/lib/request-context/route-context', () => ({
      initRouteContext: () => undefined,
    }))
    jest.doMock('@/lib/bff/core/bff-fetch-server', () => ({
      createBffFetchServer: async () => ({ fetch: jest.fn() }),
    }))
    jest.doMock('@/features/content/get-content-page', () => ({
      getContentPage: (slug: string) => mockCms(slug),
    }))
    jest.doMock('@/features/content/content-page', () => ({
      ContentPage: () => null,
    }))
    jest.doMock('next/navigation', () => ({
      notFound: () => {
        throw new Error('NEXT_NOT_FOUND')
      },
    }))
    route = {
      Page: require('@/app/[variant]/[locale]/(main)/[...page]/page').default,
      Pages: require('@/lib/slots').Pages,
    }
  })
  return route!
}

const props = (page: string[]) => ({
  params: Promise.resolve({ variant: '~', locale: 'en', page }),
  searchParams: Promise.resolve({}),
})

/** The setup page the route renders, or the error it ends in. */
async function renderSetup(route: Route) {
  return route.Page(props(['setup'])) as Promise<{ type: unknown }>
}

beforeEach(() => mockCms.mockClear())

it(`/setup on the active config: 404 on the shop config, the demo's page with the demo on`, async () => {
  const r = routeWith(entryOf(SHOP_STOREFRONT, '.'))
  if (demoIsOn()) {
    expect(Object.keys(r.Pages)).toContain('setup')
    expect((await renderSetup(r)).type).toBe(r.Pages.setup)
    expect(mockCms).not.toHaveBeenCalled()
  } else {
    expect(Object.keys(r.Pages)).not.toContain('setup')
    await expect(renderSetup(r)).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mockCms).toHaveBeenCalledWith('setup')
  }
})

describe("the demo's storefront entry, loaded directly", () => {
  it('its Pages slot mounts setup, and the catch-all renders it', async () => {
    if (!existsSync(DEMO_STOREFRONT)) {
      // `npm run use demo remove` deleted it: then the demo cannot be on
      return expect(demoIsOn()).toBe(false)
    }
    const r = routeWith(entryOf(DEMO_STOREFRONT, './storefront'))
    expect(Object.keys(r.Pages)).toContain('setup')
    expect((await renderSetup(r)).type).toBe(r.Pages.setup)
    expect(mockCms).not.toHaveBeenCalled()
  })
})

it('no app route named setup shadows the catch-all', () => {
  const routes: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) {
        if (name === 'setup') {
          routes.push(path)
        }
        walk(path)
      }
    }
  }
  walk(join(__dirname, '..', '..', 'app'))
  expect(routes).toEqual([])
})
