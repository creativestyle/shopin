import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnv } from 'node:util'
import { CORE_ENV, CORE_SECRETS, SYSTEM_ENV } from '@core/integration-kit/core'
import { revocationFile, revocationFileProblem } from '../session/revocations'

const ENV_FILE = join(__dirname, '../../../../../.env')

let held: Record<string, string> | undefined
let secrets: Readonly<Record<string, string>> | undefined

/**
 * Runs once, before any port module is required (app.module.ts calls it at import):
 * - reads the repository `.env` without loading it into `process.env` (SHOPIN_IGNORE_ENV_FILE=1 skips it);
 * - moves the core secrets (JWT, CSRF, session keys, draft secret) into a frozen core-only map;
 * - leaves in `process.env` only the core's non-secret variables and process/tool variables. Every other
 *   variable (each integration's, and any stray one) moves into a private map that only `partEnv` reads,
 *   so a port, an SDK or a module-level `process.env` read finds nothing it was not handed as options.
 */
export function loadEnvFile(): void {
  if (secrets) {
    return
  }
  const file =
    process.env.SHOPIN_IGNORE_ENV_FILE === '1' || !existsSync(ENV_FILE)
      ? {}
      : (parseEnv(readFileSync(ENV_FILE, 'utf8')) as Record<string, string>)
  const core: Record<string, string> = {}
  held = {}
  // the real environment wins over the file
  for (const [name, value] of Object.entries({ ...file, ...process.env })) {
    if (value === undefined) {
      continue
    }
    if (CORE_SECRETS.test(name)) {
      core[name] = value
    } else if (CORE_ENV.test(name) || SYSTEM_ENV.test(name)) {
      if (process.env[name] === undefined) {
        process.env[name] = value
      }
      continue
    } else {
      held[name] = value
    }
    delete process.env[name]
  }
  secrets = Object.freeze(core)
}

const REQUIRED_SECRETS = [
  'JWT_ENCRYPTION_KEY',
  'JWT_SIGNING_KEY',
  'CSRF_TOKEN_ENCRYPTION_KEY',
  'CSRF_TOKEN_SIGNING_KEY',
]

/**
 * Every problem with the core's own variables, one line each: missing secrets and, in production, the storefront's
 * origin and the revocation file.
 */
export function coreEnvProblems(
  env: Record<string, string | undefined> = process.env
): string[] {
  if (!secrets) {
    throw new Error('loadEnvFile() has not run')
  }
  const problems: string[] = []
  const missing = REQUIRED_SECRETS.filter((name) => !secrets![name]?.trim())
  if (missing.length) {
    problems.push(
      `missing core secrets: ${missing.join(', ')} (each a base64 32-byte key: openssl rand -base64 32; npm run setup creates local ones in a new .env)`
    )
  }
  if (env.NODE_ENV === 'production' && !env.FRONTEND_URL?.trim()) {
    problems.push(
      "FRONTEND_URL is not set: in production the storefront's origin (CORS, sign-in callbacks, links back to the storefront) must be given"
    )
  }
  try {
    const file = revocationFile(env)
    const unwritable = file && revocationFileProblem(file)
    if (unwritable) {
      problems.push(unwritable)
    }
  } catch (error) {
    problems.push((error as Error).message)
  }
  return problems
}

const BOOT_HINT =
  "The core's variables are in .env.example (npm run setup creates a local .env); each integration's README lists its own (integrations/README.md links them)."

/**
 * Runs `load` (the ports, which read their variables) and stops the boot once, listing every problem of the
 * core's variables and of the integrations' together. A problem that is not about configuration is thrown as it is.
 */
export function bootable<T>(load: () => T): T {
  const problems = coreEnvProblems()
  let loaded: T | undefined
  try {
    loaded = load()
  } catch (error) {
    if (!isConfigProblem(error)) {
      throw error
    }
    problems.push((error as Error).message.replace(/^shopin\.config: /, ''))
  }
  if (problems.length) {
    throw new Error(cannotStart(problems))
  }
  return loaded as T
}

/** A boot error about the shop config or the environment (shown without a stack), not a bug. */
const isConfigProblem = (error: unknown): boolean =>
  error instanceof Error && /^(shopin\.config|BFF):/.test(error.message)

/** How a boot problem is shown: one line per problem, then where the variables are documented. */
const cannotStart = (problems: string[]): string =>
  `BFF: cannot start:\n${problems.map((p) => `  - ${p.replace(/\n/g, '\n  ')}`).join('\n')}\n${BOOT_HINT}`

/**
 * What the BFF prints when it cannot start: a configuration or environment problem as its plain message (no Node
 * stack; the person who reads it edits .env or shopin.config.ts, not the code). While the ports are built
 * (`building`), a plain `Error` an integration throws (a locale without a store key) is such a
 * problem too; a `TypeError` or Nest's own errors stay bugs. Undefined for any other error.
 */
export function plainBootError(
  error: unknown,
  building = false
): string | undefined {
  if (isConfigProblem(error)) {
    return (error as Error).message
  }
  const integrationProblem =
    building &&
    error instanceof Error &&
    Object.getPrototypeOf(error) === Error.prototype
  return integrationProblem ? cannotStart([error.message]) : undefined
}

/**
 * The storefront's origin (`FRONTEND_URL`). Outside production it defaults to the local storefront; production
 * does not start without it (coreEnvProblems).
 */
export function frontendUrl(
  env: Record<string, string | undefined> = process.env
): string {
  const url = env.FRONTEND_URL?.trim()
  if (url) {
    return url
  }
  if (env.NODE_ENV === 'production') {
    throw new Error('BFF: FRONTEND_URL is not set')
  }
  return 'http://localhost:3000'
}

/** A core secret (core code only: imported, never injected, so no module can resolve it through DI). */
export function coreSecret(name: string): string | undefined {
  if (!secrets) {
    throw new Error('loadEnvFile() has not run')
  }
  return secrets[name]
}

/** A port variable, read once by the BFF to build that port's options. Never a core variable. */
/** The names of the variables the integrations may read (for a misspelling hint; never a value). */
export function partEnvNames(): string[] {
  return Object.keys(held ?? {})
}

export function partEnv(name: string): string | undefined {
  if (CORE_ENV.test(name) || SYSTEM_ENV.test(name)) {
    return undefined
  }
  return held?.[name]
}
