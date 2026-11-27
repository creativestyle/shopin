import type {
  Category,
  Integration,
  OptionalService,
  Requirement,
} from '@core/integration-kit'

/**
 * The switch's view of its lists, and the one place a choice becomes providers (BFF per request, storefront
 * variants, the /setup panel). Pure: the storefront's panel imports it too.
 */

/** A requirement's reason in a language (`de`, or a locale such as `de-DE`), English when it has none. */
export function reasonIn(
  reason: Requirement['reason'],
  language = 'en'
): string {
  return typeof reason === 'string'
    ? reason
    : (reason[language] ?? reason[language.split('-')[0]!] ?? reason.en)
}

export interface ProviderOption {
  id: string
  /** Set at boot when this provider cannot serve: its variables are missing or its credentials check failed. */
  unavailable?: string
  /** The integration's name (its descriptor's `label`; the id when it has none). */
  label: Requirement['reason']
  /** What it does (its descriptor's `description`), when it says. */
  description?: Requirement['reason']
  requires?: Requirement
  /** Commerce only: the optional services this provider leaves out. */
  omits?: readonly OptionalService[]
}

export interface CategoryView {
  category: Category
  /** Request header the storefront sends for this category, e.g. `X-Search-Provider`. */
  header: string
  /** Cookie the switcher writes for this category, e.g. `shopin-search`. */
  cookie: string
  defaultProvider: string
  options: ProviderOption[]
}

export type ProviderView = CategoryView[]
export type Selection = Partial<Record<Category, string>>
/**
 * Why no provider serves a category: the provider passed over with the code the BFF marked it with at boot
 * (`not configured`, `credentials check failed`), or the reason of a requirement the selection does not meet (in the
 * language asked for). The /setup page translates the codes.
 */
export type UnavailableWhy =
  | { provider: string; code: string }
  | { reason: string }

export interface Resolution {
  providers: Selection
  /** Per unavailable category, the reason as one English-or-requirement-language line (logs, 503 messages). */
  unavailable: Partial<Record<Category, string>>
  /** The same, as its parts. */
  why: Partial<Record<Category, UnavailableWhy>>
}

/**
 * In the `search` list: the product search of this request's commerce provider, the search a shop without a search
 * integration gets. It is no integration, so the switch serves it itself.
 */
export const COMMERCE_SEARCH = 'commerce'

const COMMERCE_SEARCH_LABEL = {
  en: "The commerce platform's own product search",
  de: 'Die Produktsuche der Commerce-Plattform',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listed = Integration<string, any>

/**
 * The categories to switch, in the order given, each with its integrations (the first is the default); the search
 * list may also name `COMMERCE_SEARCH` (`providerSwitch` refuses it in another list).
 */
export type Lists = Partial<
  Record<Category, readonly (Listed | typeof COMMERCE_SEARCH)[]>
>

/** The integrations of a list (`COMMERCE_SEARCH` is none). */
export const integrationsOf = (list: Lists[keyof Lists]): Listed[] =>
  (list ?? []).filter((i): i is Listed => i !== COMMERCE_SEARCH)

export function providerView(lists: Lists): ProviderView {
  return (
    Object.entries(lists) as [Category, readonly (Listed | string)[]][]
  ).map(([category, list]) => {
    const options = list.map(
      (entry): ProviderOption =>
        typeof entry === 'string'
          ? { id: entry, label: COMMERCE_SEARCH_LABEL }
          : {
              id: entry.id,
              label: entry.label ?? entry.id,
              ...(entry.description ? { description: entry.description } : {}),
              ...(entry.requires?.[category]
                ? { requires: entry.requires[category] }
                : {}),
              ...(category === 'commerce' && entry.omits?.length
                ? { omits: entry.omits }
                : {}),
            }
    )
    return {
      category,
      header: `X-${category[0]!.toUpperCase()}${category.slice(1)}-Provider`,
      cookie: `shopin-${category}`,
      defaultProvider: options[0]!.id,
      options,
    }
  })
}

/**
 * Whether `option` can serve next to `providers`. A need on a category the switch does not list (`switched`
 * leaves it out) is the shop config's: the kit checks it against the provider serving that category.
 */
export function fits(
  option: ProviderOption,
  providers: Selection,
  switched?: ReadonlySet<Category>
): boolean {
  return (
    !option.unavailable &&
    (
      Object.entries(option.requires?.needs ?? {}) as [Category, string][]
    ).every(([c, p]) => providers[c] === p || (switched && !switched.has(c)))
  )
}

/** Why a provider cannot serve whatever the selection: the code the BFF marked it with at boot, with its name. */
function ownUnavailability(
  option: ProviderOption,
  language?: string
): UnavailableWhy | undefined {
  return option.unavailable
    ? { provider: reasonIn(option.label, language), code: option.unavailable }
    : undefined
}

/** An unavailability as one line (logs, 503 messages, the switch's text). */
const whyText = (w: UnavailableWhy): string =>
  'code' in w ? `${w.provider}: ${w.code}` : w.reason

/**
 * The chosen provider if its requirements are met, else the first one whose are. Reasons are in `language`,
 * English by default.
 */
export function resolveProviders(
  view: ProviderView,
  chosen: Partial<Record<string, string | undefined>>,
  language?: string
): Resolution {
  const providers: Selection = {}
  const unavailable: Partial<Record<Category, string>> = {}
  const why: Partial<Record<Category, UnavailableWhy>> = {}
  const switched = new Set(view.map((c) => c.category))
  for (const c of view) {
    const wanted = c.options.find((o) => o.id === chosen[c.category])
    const ordered = wanted
      ? [wanted, ...c.options.filter((o) => o !== wanted)]
      : c.options
    const pick = ordered.find((o) => fits(o, providers, switched))
    if (pick) {
      providers[c.category] = pick.id
    } else {
      const o = wanted ?? c.options.find((x) => x.unavailable) ?? c.options[0]
      const w: UnavailableWhy = (o && ownUnavailability(o, language)) ?? {
        reason: reasonIn(o?.requires?.reason ?? 'not configured', language),
      }
      why[c.category] = w
      unavailable[c.category] = whyText(w)
    }
  }
  return { providers, unavailable, why }
}

export interface SwitcherOption {
  id: string
  /** The integration's name in the page's language: what serves the shop with this provider. */
  label: string
  /** What it does, in the page's language ('' when its descriptor has no description). */
  description: string
  selected: boolean
  /**
   * Set when this provider cannot be chosen now: it cannot serve at all (`disabledWhy` holds the code), or the
   * current selection of the other categories rules it out (its requirement's reason).
   */
  disabledReason?: string
  /** With `disabledReason` for a provider that cannot serve: its parts, for a page that translates the codes. */
  disabledWhy?: UnavailableWhy
  /** With a requirement's `disabledReason`: the providers to choose first (category and label), from its `needs`. */
  switchTo?: { category: Category; label: string }[]
}

export interface SwitcherCategory {
  category: Category
  cookie: string
  switchable: boolean
  unavailable?: string
  /** With `unavailable`: its parts, for a page that translates the codes. */
  unavailableWhy?: UnavailableWhy
  options: SwitcherOption[]
}

/**
 * The switcher's rows: every configured category, its providers with labels, and what is ruled out, with
 * the reasons in `language` (English by default).
 */
export function switcherOptions(
  view: ProviderView,
  chosen: Partial<Record<string, string | undefined>>,
  language = 'en'
): SwitcherCategory[] {
  const { providers, unavailable, why } = resolveProviders(
    view,
    chosen,
    language
  )
  const switched = new Set(view.map((v) => v.category))
  return view.map((c) => ({
    category: c.category,
    cookie: c.cookie,
    switchable: c.options.length > 1,
    ...(unavailable[c.category]
      ? {
          unavailable: unavailable[c.category],
          unavailableWhy: why[c.category],
        }
      : {}),
    options: c.options.map((o) => ({
      id: o.id,
      label: reasonIn(o.label, language),
      description: o.description ? reasonIn(o.description, language) : '',
      selected: providers[c.category] === o.id,
      ...disabled(o),
    })),
  }))

  /** Why an option cannot be chosen: its own unavailability first, else the pairing its requirement rules out. */
  function disabled(
    o: ProviderOption
  ): Pick<SwitcherOption, 'disabledReason' | 'disabledWhy' | 'switchTo'> {
    const own = ownUnavailability(o, language)
    if (own) {
      return { disabledReason: whyText(own), disabledWhy: own }
    }
    if (fits(o, providers, switched)) {
      return {}
    }
    return {
      disabledReason: reasonIn(o.requires!.reason, language),
      switchTo: (Object.entries(o.requires!.needs) as [Category, string][]).map(
        ([category, id]) => ({
          category,
          label: reasonIn(
            view
              .find((v) => v.category === category)
              ?.options.find((n) => n.id === id)?.label ?? id,
            language
          ),
        })
      ),
    }
  }
}
