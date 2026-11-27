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
export interface Resolution {
  providers: Selection
  unavailable: Partial<Record<Category, string>>
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
      unavailable[c.category] = o?.unavailable
        ? `${reasonIn(o.label, language)}: ${o.unavailable}`
        : reasonIn(o?.requires?.reason ?? 'not configured', language)
    }
  }
  return { providers, unavailable }
}

export interface SwitcherOption {
  id: string
  /** The integration's name in the page's language: what serves the shop with this provider. */
  label: string
  /** What it does, in the page's language ('' when its descriptor has no description). */
  description: string
  selected: boolean
  /** Set when the current selection of the other categories rules this provider out. */
  disabledReason?: string
  /** With `disabledReason`: the providers to choose first (category and provider label), from its `needs`. */
  switchTo?: { category: Category; label: string }[]
}

export interface SwitcherCategory {
  category: Category
  cookie: string
  switchable: boolean
  unavailable?: string
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
  const { providers, unavailable } = resolveProviders(view, chosen, language)
  return view.map((c) => ({
    category: c.category,
    cookie: c.cookie,
    switchable: c.options.length > 1,
    ...(unavailable[c.category]
      ? { unavailable: unavailable[c.category] }
      : {}),
    options: c.options.map((o) => ({
      id: o.id,
      label: reasonIn(o.label, language),
      description: o.description ? reasonIn(o.description, language) : '',
      selected: providers[c.category] === o.id,
      ...(fits(o, providers, new Set(view.map((v) => v.category)))
        ? {}
        : {
            disabledReason: reasonIn(o.requires!.reason, language),
            switchTo: (
              Object.entries(o.requires!.needs) as [Category, string][]
            ).map(([category, id]) => ({
              category,
              label: reasonIn(
                view
                  .find((v) => v.category === category)
                  ?.options.find((n) => n.id === id)?.label ?? id,
                language
              ),
            })),
          }),
    })),
  }))
}
