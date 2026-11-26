import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import type { StorefrontData } from '@core/integration-kit/core'
import { imageHosts } from './lib/image-source'

// One .env for the repository (its root). The storefront takes only its own names from it, never a BFF or
// integration variable (BFF_INTERNAL_SECRET is shared with the BFF: the checkout guard's calls); the real environment wins.
const STOREFRONT_ENV =
  /^(NEXT_[A-Z0-9_]+|FRONTEND_URL|BFF_INTERNAL_SECRET|LOG_LEVEL|LOG_PRETTY_PRINT)$/
try {
  const file = parseEnv(
    readFileSync(path.join(__dirname, '../../.env'), 'utf8')
  ) as Record<string, string>
  for (const [name, value] of Object.entries(file)) {
    if (STOREFRONT_ENV.test(name) && process.env[name] === undefined) {
      process.env[name] = value
    }
  }
} catch {
  // no .env (CI, a deployment): the environment is set by the platform
}

// The configured integrations' storefront data (written by `npm run setup` into config/storefront), read once at
// build time and inlined as JSON. The storefront never loads the BFF side of the config.
const storefront: StorefrontData = JSON.parse(
  readFileSync(
    require.resolve('@shopin/storefront/storefront-data.json'),
    'utf8'
  )
)

const withNextIntl = createNextIntlPlugin()
const svgLoader = {
  loader: '@svgr/webpack',
  options: {
    svgProps: {
      'aria-hidden': true,
      'focusable': false,
    },
  },
}

const nextConfig: NextConfig = {
  // Pino and pino-pretty must be externalized for Next.js server (see pino docs)
  serverExternalPackages: ['pino', 'pino-pretty'],
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  reactCompiler: true,
  env: { SHOPIN_STOREFRONT: JSON.stringify(storefront) },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [svgLoader],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      ...imageHosts([
        ...storefront.productImages,
        ...storefront.contentImages,
      ]).map((hostname) => ({
        protocol: 'https' as const,
        hostname,
        pathname: '/**' as const,
      })),
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default withNextIntl(nextConfig)
