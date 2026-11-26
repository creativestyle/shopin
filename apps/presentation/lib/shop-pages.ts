import { Pages } from '@/lib/slots'

/**
 * The shop's page (slot `Pages`) serving these path segments: the longest key that is a prefix of the path,
 * with the segments after it. Undefined when the shop has none (the CMS serves the path).
 */
export function findShopPage(segments: readonly string[]) {
  for (let n = segments.length; n > 0; n--) {
    const key = segments.slice(0, n).join('/')
    // own keys only: `/constructor` or `/toString` must not find Object's built-ins
    const Page = Object.hasOwn(Pages, key) ? Pages[key] : undefined
    if (Page) {
      return { Page, path: segments.slice(n) }
    }
  }
  return undefined
}

/**
 * `bff(path)` for a shop page: GET from the BFF with this request's language and providers (`fetch` from
 * createBffFetchServer), the JSON body; a 4xx/5xx throws `"<status> <text>"`, as the BFF services do.
 */
export const bffForPage =
  (fetch: (path: string, init?: RequestInit) => Promise<Response>) =>
  async (path: string): Promise<unknown> => {
    const res = await fetch(path.startsWith('/') ? path : `/${path}`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`)
    }
    return res.json()
  }
