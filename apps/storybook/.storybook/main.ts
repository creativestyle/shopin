import type { StorybookConfig } from '@storybook/nextjs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import webpack from 'webpack'

const config: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  framework: '@storybook/nextjs',
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  staticDirs: ['../public'],
  features: {
    experimentalRSC: true,
  },
  previewHead: (head, { configType }) => {
    if (configType === 'PRODUCTION') {
      const basePath = process.env.STORYBOOK_PUBLIC_PATH || '/'
      return `${head} <base href="${basePath}" />`
    }
    return head
  },
  webpackFinal: async (config) => {
    // Handle SVG imports with @svgr/webpack
    if (config.module && config.module.rules) {
      // Remove any existing SVG rules that might conflict
      config.module.rules = config.module.rules.filter((rule) => {
        if (rule && typeof rule === 'object' && 'test' in rule && rule.test) {
          return !rule.test.toString().includes('svg')
        }
        return true
      })

      // Add SVG rule for React components (default import)
      config.module.rules.push({
        test: /\.svg$/,
        oneOf: [
          // For ?url imports, treat as asset
          {
            resourceQuery: /url/,
            type: 'asset/resource',
          },
          // For default imports, treat as React component
          {
            use: ['@svgr/webpack'],
            type: 'javascript/auto',
          },
        ],
      })
    }

    if (config.resolve) {
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = dirname(__filename)

      config.resolve.alias = {
        ...config.resolve.alias,
        // Due to the import compatibility of the used components, the @ alias must point to the `../../presentation` directory.
        '@': resolve(__dirname, '../../presentation'),
        // Resolve @core/logger-config (used by presentation lib/bff). Point to dist so Docker build finds it after turbo builds it.
        '@core/logger-config': resolve(
          __dirname,
          '../../../core/logger-config/dist/index.js'
        ),
        // Resolve @core/draft-token (used by presentation lib/draft-mode).
        '@core/draft-token': resolve(
          __dirname,
          '../../../core/draft-token/dist/index.js'
        ),
        'next-intl/server': resolve(
          __dirname,
          '../src/mocks/next-intl-server.ts'
        ),
      }

      // node:crypto is pulled in by draft-mode (BFF fetch). Webpack doesn't handle node: scheme.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'crypto': false,
        'node:crypto': false,
      }
    }

    // Strip node: prefix so resolve.fallback can handle crypto.
    config.plugins = config.plugins ?? []
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '')
      })
    )

    return config
  },
}

export default config
