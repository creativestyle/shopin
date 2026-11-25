import type { Category, EnvSchema, ProviderId, ShopFacts } from '../index'
import {
  candidatesOf,
  categoriesOf,
  textOf,
  type Provider,
  type ShopinConfig,
} from './catalog'

/** The ports the BFF loads, per category: the serving integration and the ones it serves through. */
export function chosenPorts(config: ShopinConfig) {
  return categoriesOf(config).flatMap((category) => {
    const found = candidatesOf(config, category)
    if (!found) {
      return []
    }
    return [
      ...found.delegates.map((integration) => ({
        category,
        integration,
        via: found.serving.id as ProviderId | undefined,
      })),
      { category, integration: found.serving, via: undefined },
    ]
  })
}

/** What `integration`, serving `category`, sees of the shop: the providers that may serve next to it. */
function factsFor(
  config: ShopinConfig,
  integration: Provider,
  category: Category,
  locales: readonly string[]
): ShopFacts {
  const own = textOf(integration.id)!
  const providers: Partial<Record<Category, string[]>> = {}
  for (const other of categoriesOf(config)) {
    const found = candidatesOf(config, other)
    if (!found) {
      continue
    }
    const list = found.delegates.length ? found.delegates : [found.serving]
    providers[other] = list
      .filter((i) => {
        const needs = i.requires?.[other]?.needs?.[category]
        return needs === undefined || needs === own
      })
      .map((i) => textOf(i.id)!)
  }
  return { locales, providers }
}

/** A port's variables that must be set, each with why when it is one only this shop needs. */
export function neededOf(
  config: ShopinConfig,
  integration: Provider,
  category: Category,
  locales: readonly string[]
): { key: string; env: string; default?: string; reason?: string }[] {
  const schema = (integration.env?.[category] ?? {}) as EnvSchema
  return Object.entries(schema).flatMap(([key, v]) => {
    const reason =
      v.optional && v.requiredWhen
        ? v.requiredWhen(factsFor(config, integration, category, locales))
        : undefined
    return !v.optional || reason
      ? [{ key, env: v.env, default: v.default, ...(reason ? { reason } : {}) }]
      : []
  })
}

/**
 * Every variable the BFF will ask for with this config, per integration, in one list (setup writes it into `.env`):
 * what `loadPorts` checks, conditional ones included, so the BFF never asks for a second round. `optional`: the
 * variables a shop may set (declared `optional`; every one of an integration that only serves through another,
 * which is unavailable without them), each with why it is optional.
 */
export function requiredEnv(
  config: ShopinConfig,
  locales: readonly string[] = []
): {
  required: Record<string, string[]>
  reasons: Record<string, Record<string, string>>
  defaults: Record<string, Record<string, string>>
  optional: Record<string, Record<string, string>>
  forms: Record<string, Record<string, string>>
} {
  const forms: Record<string, Record<string, string>> = {}
  const required: Record<string, string[]> = {}
  const reasons: Record<string, Record<string, string>> = {}
  const defaults: Record<string, Record<string, string>> = {}
  const optional: Record<string, Record<string, string>> = {}
  const chosen = chosenPorts(config)
  // the serving ports first: a variable one of them needs is required, whoever else declares it
  for (const { category, integration, via } of [
    ...chosen.filter((c) => !c.via),
    ...chosen.filter((c) => c.via),
  ]) {
    const id = textOf(integration.id)!
    const needed = neededOf(config, integration, category, locales)
    for (const n of needed) {
      if (n.default !== undefined) {
        ;(defaults[id] ??= {})[n.env] = n.default
      } else if (via) {
        if (!required[id]?.includes(n.env)) {
          ;(optional[id] ??= {})[n.env] =
            `optional: without it "${id}" is unavailable and "${textOf(via)}" serves without it`
        }
      } else if (!(required[id] ??= []).includes(n.env)) {
        required[id]!.push(n.env)
        delete optional[id]?.[n.env]
      }
      if (n.reason) {
        ;(reasons[id] ??= {})[n.env] = n.reason
      }
    }
    const schema = (integration.env?.[category] ?? {}) as EnvSchema
    for (const v of Object.values(schema)) {
      if (v.form) {
        ;(forms[id] ??= {})[v.env] = v.form
      }
    }
    for (const v of Object.values(schema)) {
      if (
        v.optional &&
        v.default === undefined &&
        !needed.some((n) => n.env === v.env) &&
        !required[id]?.includes(v.env) &&
        !optional[id]?.[v.env]
      ) {
        ;(optional[id] ??= {})[v.env] =
          'optional (its README says when to set it)'
      }
    }
  }
  for (const [id, names] of Object.entries(optional)) {
    if (!Object.keys(names).length) {
      delete optional[id]
    }
  }
  return { required, reasons, defaults, optional, forms }
}
