/**
 * Boots the stack the journey specs run against:
 *   storefront (:3200, the build:e2e output) → fault proxy (:4100) → real BFF (:4101)
 *
 * Build first: `npm run build` in test/e2e. Playwright runs this as a webServer;
 * `npm run stack` runs it on its own (e.g. for UI mode). It stays in the
 * foreground and stops everything on Ctrl+C.
 *
 * Commerce, search and CMS integrations are picked per request through the
 * data-source cookie the specs set, so one BFF serves every choice. Credentials
 * missing from the root .env get dummy values pointing at a dead local port,
 * so any call to an outside service fails loudly instead of leaving the machine.
 */

import { spawn, type ChildProcess } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parseEnv } from 'node:util'
import { BFF_PORT, FAULT_PROXY_PORT, JOURNEY_APP_PORT } from '../config'
import { createFaultProxy } from '../fault-proxy/server'
import {
  formatIntegrationReport,
  resolveIntegrations,
} from './integration-choice'

const rootDir = path.resolve(__dirname, '../../..')
const bffEntry = path.join(rootDir, 'apps/bff/dist/main.js')
const appDir = path.join(rootDir, 'apps/presentation')
const appEntry = path.join(
  appDir,
  '.next/standalone/apps/presentation/server.js'
)

const STOREFRONT_ORIGIN = `http://localhost:${JOURNEY_APP_PORT}`
const PROXY_BFF_URL = `http://localhost:${FAULT_PROXY_PORT}/bff`
const DEAD_URL = 'http://127.0.0.1:9'

const children: ChildProcess[] = []
let stopping = false
let ready = false

function readRootEnv(): NodeJS.Dict<string> {
  const file = path.join(rootDir, '.env')
  return existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {}
}

const randomKey = () => randomBytes(32).toString('base64')

/** Values the BFF needs at boot; only filled in where the root .env has none. */
function bffFallbackEnv(rootEnv: NodeJS.Dict<string>) {
  const fallbacks: Record<string, () => string> = {
    COMMERCETOOLS_CLIENT_ID: () => 'e2e',
    COMMERCETOOLS_CLIENT_SECRET: () => 'e2e',
    COMMERCETOOLS_PROJECT_KEY: () => 'e2e',
    COMMERCETOOLS_API_URL: () => DEAD_URL,
    COMMERCETOOLS_AUTH_URL: () => DEAD_URL,
    CONTENTFUL_SPACE: () => 'e2e',
    CONTENTFUL_ENVIRONMENT: () => 'e2e',
    CONTENTFUL_ACCESS_TOKEN: () => 'e2e',
    CONTENTFUL_PREVIEW_ACCESS_TOKEN: () => 'e2e',
    JWT_ENCRYPTION_KEY: randomKey,
    JWT_SIGNING_KEY: randomKey,
    CSRF_TOKEN_ENCRYPTION_KEY: randomKey,
    CSRF_TOKEN_SIGNING_KEY: randomKey,
  }
  return Object.fromEntries(
    Object.entries(fallbacks)
      .filter(([name]) => !process.env[name] && !rootEnv[name])
      .map(([name, value]) => [name, value()])
  )
}

function start(
  name: string,
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  cwd = rootDir
) {
  // Same process group: Playwright's teardown and Ctrl+C also end what npm scripts start
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  child.on('exit', (code, signal) => {
    if (!stopping) {
      console.error(
        `[e2e] ${name} exited (${signal ?? code}); stopping the stack`
      )
      stop(1)
    }
  })
  children.push(child)
}

async function waitFor(name: string, url: string, init?: RequestInit) {
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, init)
      if (res.status < 500) return
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`[e2e] ${name} not ready at ${url}`)
}

function stop(code = 0) {
  stopping = true
  for (const child of children) child.kill('SIGTERM')
  process.exit(code)
}

async function main() {
  const integrations = resolveIntegrations()
  for (const [file, hint] of [
    [bffEntry, 'build the BFF'],
    [appEntry, 'run build:e2e in apps/presentation'],
  ]) {
    if (!existsSync(file)) {
      throw new Error(
        `[e2e] Missing ${file}: ${hint} (npm run build in test/e2e)`
      )
    }
  }

  start('BFF', process.execPath, [bffEntry], {
    PORT: String(BFF_PORT),
    FRONTEND_URL: STOREFRONT_ORIGIN,
    // Journeys exceed the 5 req/min limit on auth, payment and order routes
    BFF_RATE_LIMIT_ENABLED: 'false',
    LOG_LEVEL: process.env.LOG_LEVEL ?? 'warn',
    ...bffFallbackEnv(readRootEnv()),
  })

  const proxy = createFaultProxy(
    { host: '127.0.0.1', port: BFF_PORT },
    () => ready
  )
  await new Promise<void>((resolve) => proxy.listen(FAULT_PROXY_PORT, resolve))

  // The same start:e2e as the platform storefront; these values win over .env.e2e
  start(
    'storefront',
    'npm',
    ['run', 'start:e2e'],
    {
      PORT: String(JOURNEY_APP_PORT),
      NEXT_BFF_INTERNAL_URL: PROXY_BFF_URL,
      FRONTEND_URL: STOREFRONT_ORIGIN,
      LOG_LEVEL: process.env.LOG_LEVEL ?? 'warn',
    },
    appDir
  )

  await waitFor('BFF', `http://127.0.0.1:${FAULT_PROXY_PORT}/bff/csrf/token`)
  await waitFor('storefront', `http://127.0.0.1:${JOURNEY_APP_PORT}/`, {
    headers: { cookie: `data-source=${integrations.dataSource}` },
  })

  ready = true
  console.log(formatIntegrationReport(integrations))
  console.log(
    `[e2e] Stack ready: storefront ${STOREFRONT_ORIGIN}, BFF ${PROXY_BFF_URL}`
  )
}

process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  stop(1)
})
