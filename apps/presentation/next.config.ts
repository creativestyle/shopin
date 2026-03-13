import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { CONTENT_IMAGE_API_HOSTS } from '@config/constants'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  // Pino and pino-pretty must be externalized for Next.js server (see pino docs)
  serverExternalPackages: ['pino', 'pino-pretty'],
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  reactCompiler: true,
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.eu-central-1.aws.commercetools.com',
        pathname: '/**',
      },
      ...CONTENT_IMAGE_API_HOSTS.map((hostname) => ({
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
