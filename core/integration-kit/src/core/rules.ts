import type { Category, EnvSchema, Integration } from '../index'
import {
  CATEGORIES,
  candidatesOf,
  categoriesOf,
  provides,
  reasonIn,
  textOf,
  type ContractExtensions,
  type ShopinConfig,
} from './catalog'

/**
 * The categories whose integrations fill a contract: carts and products come from commerce, cards from search
 * and from commerce (category pages, wishlists).
 */
const FILLED_BY: Record<keyof ContractExtensions, readonly Category[]> = {
  cart: ['commerce'],
  productCard: ['commerce', 'search'],
  product: ['commerce'],
}

/** The BFF core's own variables. A port may not declare them; only the core reads them. */
export const CORE_ENV =
  /^(NODE_ENV|PORT|HOST|TZ|FRONTEND_URL|NEXT_DRAFT_MODE_SECRET|BFF_[A-Z0-9_]+|JWT_[A-Z0-9_]+|CSRF_[A-Z0-9_]+|SESSION_[A-Z0-9_]+|SHOPIN_[A-Z0-9_]+|LOG_[A-Z0-9_]+|CORS_[A-Z0-9_]+)$/

/** Process and tool variables: no port may declare (and so remove) them. */
export const SYSTEM_ENV =
  /^(PATH|HOME|USER|SHELL|PWD|TMPDIR|TMP|TEMP|LANG|LC_[A-Z_]+|TERM|CI|NODE_[A-Z0-9_]+|NPM_[A-Z0-9_]+|npm_[a-z0-9_]+|TURBO_[A-Z0-9_]+|NEXT_[A-Z0-9_]+)$/

/** Core secrets: read once into the core-only config, then removed from `process.env`. */
export const CORE_SECRETS =
  /^(JWT_|CSRF_|SESSION_)[A-Z0-9_]+$|^NEXT_DRAFT_MODE_SECRET$/

export function configErrors(config: ShopinConfig): string[] {
  const errors: string[] = []
  const byId = new Map(config.integrations.map((i) => [i.id, i]))
  if (!config.providers.commerce) {
    errors.push('no commerce provider')
  }
  // SHOPin's categories (configured or not) first, then the shop's own kinds
  const order = [
    ...CATEGORIES,
    ...categoriesOf(config).filter((c) => !CATEGORIES.includes(c)),
  ]
  for (const category of order) {
    const ids = config.providers[category] ? [config.providers[category]!] : []
    for (const id of ids) {
      const integration = byId.get(id)
      if (!integration) {
        errors.push(`${category} uses "${id}", which is not configured`)
        continue
      }
      if (!provides(integration as unknown as Integration).includes(category)) {
        errors.push(`"${id}" does not provide ${category}`)
      }
      const requirement = integration.requires?.[category]
      for (const [other, provider] of Object.entries(
        requirement?.needs ?? {}
      ) as [Category, string][]) {
        if (
          !order.includes(other) ||
          order.indexOf(other) >= order.indexOf(category)
        ) {
          errors.push(
            order.includes(other)
              ? `"${id}" as ${category} may only need an earlier category, not ${other}`
              : `"${id}" as ${category} needs ${other} "${provider}": ${reasonIn(requirement!.reason)}`
          )
        } else if (textOf(config.providers[other]) !== provider) {
          errors.push(
            `"${id}" as ${category} needs ${other} "${provider}": ${reasonIn(requirement!.reason)}. Fix: serve ${other} with "${provider}" too, or drop ${category} (or give it another integration)`
          )
        }
      }
    }
  }
  // a delegate's needs on a category its integration does not serve hold for the whole config
  for (const category of order) {
    const found = config.providers[category]
      ? candidatesOf(config, category)
      : undefined
    for (const delegate of found?.delegates ?? []) {
      const requirement = delegate.requires?.[category]
      for (const [other, provider] of Object.entries(
        requirement?.needs ?? {}
      ) as [Category, string][]) {
        const serving = config.providers[other]
        if (serving === found!.serving.id || textOf(serving) === provider) {
          continue
        }
        errors.push(
          `"${delegate.id}" as ${category} (through "${found!.serving.id}") needs ${other} "${provider}": ${reasonIn(requirement!.reason)}`
        )
      }
    }
  }
  // an extended contract: every integration that fills it maps the shop's fields (a swap cannot drop them)
  for (const contract of Object.keys(
    config.contracts ?? {}
  ) as (keyof ContractExtensions)[]) {
    const ids = new Set(
      (FILLED_BY[contract] ?? []).flatMap((c) => {
        const found = candidatesOf(config, c)
        if (!found) {
          return []
        }
        return found.delegates.length
          ? found.delegates.map((d) => d.id)
          : [found.serving.id]
      })
    )
    for (const id of ids) {
      const integration = byId.get(id)
      if (integration && !integration.mappers?.[contract]) {
        errors.push(
          `contracts.${contract} adds the shop's fields, but "${id}" fills ${contract} without a mappers.${contract} hook: give it one, or the fields are missing wherever "${id}" serves`
        )
      }
    }
  }
  // env: no core or system variable, and no variable of another integration
  const owner = new Map<string, string>()
  for (const integration of config.integrations) {
    for (const schema of Object.values(integration.env ?? {}) as EnvSchema[]) {
      for (const { env } of Object.values(schema)) {
        if (CORE_ENV.test(env)) {
          errors.push(`"${integration.id}" declares the core variable ${env}`)
        } else if (SYSTEM_ENV.test(env)) {
          errors.push(`"${integration.id}" declares the system variable ${env}`)
        }
        const other = owner.get(env)
        if (other && other !== textOf(integration.id)) {
          errors.push(
            `${env} is declared by both "${other}" and "${integration.id}"`
          )
        }
        owner.set(env, textOf(integration.id)!)
      }
    }
  }
  return errors
}
