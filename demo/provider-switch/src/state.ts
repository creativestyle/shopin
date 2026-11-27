import type { Category, Delegates, RequestContext } from '@core/integration-kit'
import { resolveProviders, type ProviderView, type Resolution } from './view'

/** What the switch's ports learn at boot, shared with its BFF route (`./module`). */
export const state: {
  view: ProviderView
  delegates: Partial<Record<Category, Delegates>>
  context?: RequestContext
} = { view: [], delegates: {} }

/** The view with the delegates the BFF could not load, or whose credentials check failed, marked unavailable. */
export const viewNow = (): ProviderView =>
  state.view.map((c) => ({
    ...c,
    options: c.options.map((o) => {
      const reason = state.delegates[c.category]?.unavailable[o.id]
      return reason ? { ...o, unavailable: reason } : o
    }),
  }))

/** This request's providers: each category's `X-<Category>-Provider` header, resolved against the requirements. */
export function current(language?: string): Resolution {
  const view = viewNow()
  return resolveProviders(
    view,
    Object.fromEntries(
      view.map((c) => [
        c.category,
        state.context?.header(c.header)?.trim().toLowerCase(),
      ])
    ),
    language
  )
}
