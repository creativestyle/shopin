import {
  switcherOptions,
  type ProviderView,
  type Selection,
  type UnavailableWhy,
} from '@demo/provider-switch/view'
import type { Category } from '@core/integration-kit'

/**
 * The /setup page's rows: per category the switch lists, the installed integrations it switches between, each by
 * what its descriptor declares (`label` and `description`, in the page's language), and a provider the other
 * categories' choice rules out disabled with the reason its descriptor gives. Nothing here names a provider: the
 * switch's view (`GET /bff/switch`) is the only source.
 */
export interface SetupOption {
  id: string
  /** The descriptor's `label`: the integration's name. */
  name: string
  /** The descriptor's `description` ('' for a descriptor without one). */
  description: string
  selected: boolean
  /**
   * Set when this provider cannot be chosen now: it cannot serve at all (a fixed reason the page translates), or the
   * selection of the other categories rules it out (its descriptor's reason, in the page's language).
   */
  disabledReason?: SetupUnavailable
}

/**
 * Why no provider can serve a category now: a fixed reason the page translates (`dataSourceSelector.reasons.<code>`,
 * with the provider's name), or text already in the page's language (a requirement's reason from a descriptor).
 */
export type SetupUnavailable =
  | { code: 'notConfigured' | 'checkFailed'; provider: string }
  | { text: string }

export interface SetupCategory {
  category: Category
  /** The switch's cookie for this category. */
  cookie: string
  /** Set when no provider can serve this category now. */
  unavailable?: SetupUnavailable
  options: SetupOption[]
}

/** The codes the BFF marks a provider with at boot, as the page's translation keys. */
const REASON_KEYS: Readonly<Record<string, 'notConfigured' | 'checkFailed'>> = {
  'not configured': 'notConfigured',
  'credentials check failed': 'checkFailed',
}

function unavailableOf(why: UnavailableWhy): SetupUnavailable {
  if (!('code' in why)) {
    return { text: why.reason }
  }
  const code = REASON_KEYS[why.code]
  // a code this page has no text for: shown as the switch gives it
  return code
    ? { code, provider: why.provider }
    : { text: `${why.provider}: ${why.code}` }
}

export function setupRows(
  view: ProviderView,
  selected: Selection,
  language = 'en'
): SetupCategory[] {
  return switcherOptions(view, selected, language).map((c) => ({
    category: c.category,
    cookie: c.cookie,
    ...(c.unavailableWhy
      ? { unavailable: unavailableOf(c.unavailableWhy) }
      : {}),
    options: c.options.map((o) => ({
      id: o.id,
      name: o.label,
      description: o.description,
      selected: o.selected,
      ...(o.disabledReason
        ? {
            disabledReason: o.disabledWhy
              ? unavailableOf(o.disabledWhy)
              : { text: o.disabledReason },
          }
        : {}),
    })),
  }))
}
