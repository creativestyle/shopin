/**
 * Calls to the BFF the way the storefront makes them (CSRF token, data source,
 * language), for setting up state a test does not walk through itself.
 */

import { expect, type APIRequestContext } from '@playwright/test'
import { BFF_URL } from '../../config'
import { LOCALE } from './i18n'

export function bffApi(request: APIRequestContext, dataSource?: string) {
  const headers = {
    'accept-language': LOCALE,
    ...(dataSource && { 'x-data-source': dataSource }),
  }
  const url = (path: string) => `${BFF_URL}/${path}`

  async function csrfToken(): Promise<string> {
    const res = await request.get(url('csrf/token'), { headers })
    expect(res.ok(), `GET csrf/token: ${res.status()}`).toBe(true)
    return ((await res.json()) as { token: string }).token
  }

  async function get<T>(path: string): Promise<T> {
    const res = await request.get(url(path), { headers })
    expect(res.ok(), `GET ${path}: ${res.status()}`).toBe(true)
    return (await res.json().catch(() => null)) as T
  }

  async function send<T>(
    method: 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: unknown
  ): Promise<T> {
    const res = await request.fetch(url(path), {
      method,
      headers: { ...headers, 'x-csrf-token': await csrfToken() },
      data,
    })
    expect(
      res.ok(),
      `${method} ${path}: ${res.status()} ${await res.text()}`
    ).toBe(true)
    return (await res.json().catch(() => ({}))) as T
  }

  return {
    get,
    post: <T>(path: string, data: unknown) => send<T>('POST', path, data),
    put: <T>(path: string, data: unknown) => send<T>('PUT', path, data),
    delete: <T>(path: string, data?: unknown) => send<T>('DELETE', path, data),
  }
}

/** Removes every line of the session's cart; returns its id, if it has one. */
export async function emptyCart(api: ReturnType<typeof bffApi>) {
  const cart = await api.get<{
    id: string
    lineItems: { id: string }[]
  } | null>('cart')
  for (const { id } of cart?.lineItems ?? []) {
    await api.delete('cart/items', { lineItemId: id })
  }
  return cart?.id
}

/** Removes every item of the session's wishlist; returns its id, if it has one. */
export async function emptyWishlist(api: ReturnType<typeof bffApi>) {
  const wishlist = await api.get<{
    id: string
    items: { id: string }[]
  } | null>('wishlist')
  for (const { id } of wishlist?.items ?? []) {
    await api.delete('wishlist/items', { lineItemId: id })
  }
  return wishlist?.id
}

/** Status of a plain GET to a BFF route, e.g. bffStatus(request, 'csrf/token'). */
export async function bffStatus(
  request: APIRequestContext,
  route: string,
  options: { dataSource?: string; timeout?: number } = {}
) {
  const res = await request.get(`${BFF_URL}/${route}`, {
    headers: {
      'accept-language': LOCALE,
      ...(options.dataSource && { 'x-data-source': options.dataSource }),
    },
    timeout: options.timeout,
  })
  return res.status()
}
