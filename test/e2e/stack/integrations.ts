/**
 * Which integration serves each category in a run.
 *
 * Chosen with `npm run e2e -- commerce=commercetools search=algolia` (or the
 * E2E_COMMERCE / E2E_SEARCH / E2E_CMS env vars); every category is mock by default.
 * Today the BFF offers fixed data sources, so a choice maps to one of them.
 */

export const CATEGORIES = ['commerce', 'search', 'cms'] as const
export type Category = (typeof CATEGORIES)[number]

export type DataSource =
  | 'mock-set'
  | 'commercetools-set'
  | 'commercetools-algolia-set'

interface IntegrationSet {
  dataSource: DataSource
  serves: Record<Category, string>
  /** Categories always served the same way, whatever the set. */
  fixed: Record<string, string>
}

const SETS: IntegrationSet[] = [
  {
    dataSource: 'mock-set',
    serves: { commerce: 'mock', search: 'mock', cms: 'mock' },
    fixed: { auth: 'mock', customer: 'mock', payment: 'mock' },
  },
  {
    dataSource: 'commercetools-set',
    serves: {
      commerce: 'commercetools',
      search: 'commercetools',
      cms: 'contentful',
    },
    fixed: {
      auth: 'commercetools',
      customer: 'commercetools',
      payment: 'mock',
    },
  },
  {
    dataSource: 'commercetools-algolia-set',
    serves: { commerce: 'commercetools', search: 'algolia', cms: 'contentful' },
    fixed: {
      auth: 'commercetools',
      customer: 'commercetools',
      payment: 'mock',
    },
  },
]

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

export function formatIntegrationReport(set: IntegrationSet) {
  const rows = { ...set.serves, ...set.fixed }
  return [
    `[e2e] Data source: ${set.dataSource}`,
    ...Object.entries(rows).map(
      ([category, integration]) =>
        `[e2e]   ${category.padEnd(9)} ${integration}`
    ),
  ].join('\n')
}
