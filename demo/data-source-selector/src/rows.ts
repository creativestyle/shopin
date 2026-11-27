import {
  switcherOptions,
  type ProviderView,
  type Selection,
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
  /** Set when the selection of the other categories rules this provider out. */
  disabledReason?: string
}

export interface SetupCategory {
  category: Category
  /** The switch's cookie for this category. */
  cookie: string
  /** Set when no provider can serve this category now. */
  unavailable?: string
  options: SetupOption[]
}

export function setupRows(
  view: ProviderView,
  selected: Selection,
  language = 'en'
): SetupCategory[] {
  return switcherOptions(view, selected, language).map((c) => ({
    category: c.category,
    cookie: c.cookie,
    ...(c.unavailable ? { unavailable: c.unavailable } : {}),
    options: c.options.map((o) => ({
      id: o.id,
      name: o.label,
      description: o.description,
      selected: o.selected,
      ...(o.disabledReason ? { disabledReason: o.disabledReason } : {}),
    })),
  }))
}
