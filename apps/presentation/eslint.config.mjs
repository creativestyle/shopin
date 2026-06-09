import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import tailwind from 'eslint-plugin-tailwindcss'
import pluginQuery from '@tanstack/eslint-plugin-query'

const FEATURE_BOUNDARY_MESSAGE =
  'Import only feature entry points (files at the feature root). Do not import from any subdirectory of a feature.'

// Every server-rendered page and layout under app/[variant]/[locale]/ must call
// initRouteContext({ variant, locale }). Under ISR (revalidate=3600 on the layout), each
// segment renders independently — the parent layout may be served from cache without
// re-executing, so children cannot rely on the layout having already set the locale
// (next-intl) or the variant (server BFF data-source routing). initRouteContext sets both
// atomically. The rule fires unconditionally for all non-client route files.
const requireInitRouteContext = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require initRouteContext in every server-rendered variant/locale page/layout.',
    },
    messages: {
      missing:
        'Variant/locale route files must call initRouteContext({ variant, locale }). ' +
        'Under ISR each segment may render independently of its parent layout, ' +
        'so every page and layout must initialise both locale (next-intl) and variant ' +
        '(server BFF data-source) for the current render.',
    },
  },
  create(context) {
    let callsInitRouteContext = false
    let isClientComponent = false

    return {
      'ExpressionStatement'(node) {
        if (
          node.expression.type === 'Literal' &&
          node.expression.value === 'use client'
        ) {
          isClientComponent = true
        }
      },
      'CallExpression'(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'initRouteContext'
        ) {
          callsInitRouteContext = true
        }
      },
      'Program:exit'(node) {
        if (!isClientComponent && !callsInitRouteContext) {
          context.report({ node, messageId: 'missing' })
        }
      },
    }
  },
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...pluginQuery.configs['flat/recommended'],
  ...tailwind.configs['flat/recommended'],
  {
    settings: {
      tailwindcss: {
        config: process.cwd() + '/app/globals.css',
      },
    },
    rules: {
      'tailwindcss/no-custom-classname': 'off',
      'curly': 'error',
    },
  },
  // Feature boundary: only root-level feature imports allowed (applies to all code including other features).
  // Allowed: @/features/<feature>/<file> (exactly 2 path segments after @/features).
  // Forbidden: @/features/<feature>/<subdir>/... (3+ segments, e.g. hooks/, components/, lib/).
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*/*', '@/features/*/*/*/**'],
              message: FEATURE_BOUNDARY_MESSAGE,
            },
          ],
        },
      ],
    },
  },
  // In [variant]/[locale] route files, initRouteContext must be called to initialise both
  // the next-intl locale and the server BFF variant. This rule enforces that contract —
  // see the requireInitRouteContext rule above.
  {
    // Note: \\[ and \\] escape the square brackets so glob treats [variant] and [locale]
    // as literal directory names rather than character classes.
    files: [
      'app/\\[variant\\]/\\[locale\\]/**/page.tsx',
      'app/\\[variant\\]/\\[locale\\]/**/layout.tsx',
    ],
    plugins: {
      'route-context': {
        rules: { 'require-init-route-context': requireInitRouteContext },
      },
    },
    rules: {
      'route-context/require-init-route-context': 'error',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
