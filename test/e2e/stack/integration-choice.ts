/**
 * Which integration serves each category in a run.
 *
 * Chosen with `npm run e2e -- commerce=commercetools search=algolia` (or the
 * E2E_COMMERCE / E2E_SEARCH / E2E_CMS env vars); every category is mock by default.
 * Today the BFF offers fixed data sources, so a choice maps to one of them. What
 * actually served each category comes from the BFF: `GET /bff/capabilities`.
 */

import type { DataSource } from '@config/constants'
import {
  CapabilitiesResponseSchema,
  type CapabilitiesResponse,
} from '@core/contracts/capabilities/capabilities'

const CATEGORIES = ['commerce', 'search', 'cms'] as const
export type Category = (typeof CATEGORIES)[number]

// A Record, so a data source added to or removed from @config/constants fails check-types
const SERVES: Record<DataSource, Record<Category, string>> = {
  'mock-set': { commerce: 'mock', search: 'mock', cms: 'mock' },
  'commercetools-set': {
    commerce: 'commercetools',
    search: 'commercetools',
    cms: 'contentful',
  },
  'commercetools-algolia-set': {
    commerce: 'commercetools',
    search: 'algolia',
    cms: 'contentful',
  },
}

export interface IntegrationSet {
  dataSource: DataSource
  serves: Record<Category, string>
}

const SETS: IntegrationSet[] = Object.entries(SERVES).map(
  ([dataSource, serves]) => ({ dataSource: dataSource as DataSource, serves })
)

const envName = (category: Category) => `E2E_${category.toUpperCase()}`

/** The env choice for a category, lowercased like the command-line choices. */
const envChoice = (env: NodeJS.ProcessEnv, category: Category) =>
  env[envName(category)]?.toLowerCase()

/** Reads `category=integration` pairs; anything else is left for Playwright. */
export function splitIntegrationArgs(args: string[]) {
  const choices: Partial<Record<Category, string>> = {}
  const rest: string[] = []
  for (const arg of args) {
    const [key, value] = arg.split('=')
    if (value && (CATEGORIES as readonly string[]).includes(key)) {
      choices[key as Category] = value.toLowerCase()
    } else {
      rest.push(arg)
    }
  }
  return { choices, rest }
}

export function integrationEnv(choices: Partial<Record<Category, string>>) {
  return Object.fromEntries(
    Object.entries(choices).map(([category, value]) => [
      envName(category as Category),
      value,
    ])
  )
}

function describeSet(set: IntegrationSet) {
  return CATEGORIES.map(
    (category) => `${category}=${set.serves[category]}`
  ).join(' ')
}

/** The data source serving the chosen integrations; unset categories prefer mock. */
export function resolveIntegrations(
  env: NodeJS.ProcessEnv = process.env
): IntegrationSet {
  const chosen = CATEGORIES.filter((category) => envChoice(env, category))
  const match = SETS.find((set) =>
    chosen.every(
      (category) => set.serves[category] === envChoice(env, category)
    )
  )
  if (!match) {
    const asked = chosen.map((c) => `${c}=${envChoice(env, c)}`).join(' ')
    throw new Error(
      `[e2e] No data source serves "${asked}". Supported:\n` +
        SETS.map((set) => `  ${describeSet(set)}`).join('\n')
    )
  }
  return match
}

export const isMockRun = (set: IntegrationSet) => set.dataSource === 'mock-set'

/** What the BFF reports serving each category for the data source. */
export async function fetchCapabilities(
  bffUrl: string,
  dataSource: DataSource
): Promise<CapabilitiesResponse> {
  const res = await fetch(`${bffUrl}/capabilities`, {
    headers: { 'x-data-source': dataSource },
  })
  if (!res.ok) {
    throw new Error(`[e2e] GET ${bffUrl}/capabilities: ${res.status}`)
  }
  // The contract the endpoint answers with: a changed shape fails the run
  return CapabilitiesResponseSchema.parse(await res.json())
}

export function formatCapabilitiesReport(capabilities: CapabilitiesResponse) {
  return [
    `[e2e] Data source: ${capabilities.dataSource} (from /bff/capabilities)`,
    ...Object.entries(capabilities.integrations).map(
      ([category, integration]) =>
        `[e2e]   ${category.padEnd(9)} ${integration}`
    ),
  ].join('\n')
}
