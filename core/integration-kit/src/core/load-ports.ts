import type { Category, EnvSchema, PortDefinition, ProviderId } from '../index'
import { textOf, type ShopinConfig } from './catalog'
import { closest } from './closest'
import { chosenPorts, neededOf } from './env'

export interface LoadedPort {
  category: Category
  id: ProviderId
  port: PortDefinition
  options: Record<string, string | undefined>
  /** Set for a delegate: the integration that serves through it. */
  via?: ProviderId
}

/**
 * For every category: reads the serving port's declared variables through `get` (and those of the integrations it
 * serves through, `delegates`), then loads the ports. Throws one error naming every missing variable before any
 * port is loaded; a delegate without its variables is left out and listed as unavailable instead.
 */
export interface LoadPortsOptions {
  /** Reads one environment variable (the BFF passes its validated env). */
  get: (name: string) => string | undefined
  /** What `{BFF_URL}` in a value or default stands for: the BFF's public URL, from the BFF's own config. */
  bffUrl: string
  /** The shop's locales (config/locales.json). */
  locales?: readonly string[]
  /** The variable names the environment sets: a missing one that is a misspelling of one of them says so. */
  present?: readonly string[]
}

export function loadPorts(
  config: ShopinConfig,
  { get, bffUrl, locales = [], present = [] }: LoadPortsOptions
): {
  ports: LoadedPort[]
  /** Delegates left out for missing variables. */
  unavailable: {
    category: Category
    id: ProviderId
    via: ProviderId
    reason: string
  }[]
} {
  const chosen = chosenPorts(config)
  // integration id → its missing variables, each once (one variable may serve several categories)
  const missing = new Map<string, Set<string>>()
  const why = new Map<string, string>()
  const unavailable: {
    category: Category
    id: ProviderId
    via: ProviderId
    reason: string
  }[] = []
  const read = chosen.flatMap(({ category, integration, via }) => {
    const options: Record<string, string | undefined> = {}
    const lacking: string[] = []
    // every declared variable reaches the port; the needed ones must be set
    for (const [key, v] of Object.entries(
      (integration.env?.[category] ?? {}) as EnvSchema
    )) {
      options[key] = (get(v.env)?.trim() || v.default || undefined)?.replaceAll(
        '{BFF_URL}',
        bffUrl.replace(/\/$/, '')
      )
    }
    for (const n of neededOf(config, integration, category, locales)) {
      if (options[n.key] === undefined) {
        lacking.push(n.env)
        if (n.reason) {
          why.set(n.env, n.reason)
        }
      }
    }
    if (lacking.length && via) {
      unavailable.push({
        category,
        id: integration.id,
        via,
        reason: `its variables are not set (${lacking.join(', ')}): add them to .env`,
      })
      return []
    }
    for (const name of lacking) {
      missing.set(
        textOf(integration.id)!,
        (missing.get(textOf(integration.id)!) ?? new Set()).add(name)
      )
    }
    return [{ category, integration, options, via }]
  })
  if (missing.size) {
    throw new Error(
      `shopin.config: missing env for the chosen providers:\n${[...missing]
        .map(
          ([id, names]) =>
            `  - ${id}: ${[...names].join(', ')}${[...names]
              .filter((n) => why.has(n))
              .map((n) => `\n      ${n}: ${why.get(n)}`)
              .join('')}${[...names]
              .flatMap((n) => {
                const near = present.filter(
                  (p) =>
                    p !== n &&
                    (p.startsWith(`${n}_`) ||
                      n.startsWith(`${p}_`) ||
                      closest(p, [n]) === n)
                )
                return near.map(
                  (p) => `\n      ${n}: did you mean it? .env sets ${p}`
                )
              })
              .join('')}`
        )
        .join('\n')}`
    )
  }
  const ports = read.map(({ category, integration, options, via }) => {
    let port: PortDefinition
    try {
      port = (integration.ports as Record<Category, () => PortDefinition>)[
        category
      ]()
    } catch (error) {
      if ((error as { code?: string }).code !== 'MODULE_NOT_FOUND') {
        throw error
      }
      throw new Error(
        `shopin.config: "${integration.id}" (${category}) cannot load: ${(error as Error).message.split('\n')[0]}. Its packages are not installed for this config: run npm run setup`
      )
    }
    if (port?.category !== category) {
      throw new Error(
        `shopin.config: "${integration.id}" ports.${category} must return port('${category}', …)`
      )
    }
    return {
      category,
      id: integration.id,
      port,
      options,
      ...(via ? { via } : {}),
    }
  })
  return { ports, unavailable }
}
