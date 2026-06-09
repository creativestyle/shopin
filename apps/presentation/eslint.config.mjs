import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import tailwind from 'eslint-plugin-tailwindcss'
import pluginQuery from '@tanstack/eslint-plugin-query'

const FEATURE_BOUNDARY_MESSAGE =
  'Import only feature entry points (files at the feature root). Do not import from any subdirectory of a feature.'

// Every server-rendered page and layout under app/[locale]/ must call setRequestLocale(locale).
// Under ISR (revalidate=3600 on [locale]/layout.tsx), each segment renders independently —
// the parent layout may be served from cache without re-executing, so children cannot rely
// on the layout's setRequestLocale call. The rule fires unconditionally for all non-client
// locale route files, regardless of whether they directly import next-intl APIs.
const requireSetRequestLocale = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require setRequestLocale in every server-rendered locale page/layout.',
    },
    messages: {
      missing:
        'Locale route files must call setRequestLocale(locale). ' +
        'Under ISR each segment may render independently of its parent layout, ' +
        'so every page and layout must set the locale for next-intl.',
    },
  },
  create(context) {
    let callsSetRequestLocale = false
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
          node.callee.name === 'setRequestLocale'
        ) {
          callsSetRequestLocale = true
        }
      },
      'Program:exit'(node) {
        if (!isClientComponent && !callsSetRequestLocale) {
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
  // In [locale] route files, setRequestLocale must be called whenever next-intl translation
  // APIs are used. This rule enforces that contract — see the requireSetRequestLocale rule above.
  {
    // Note: \\[ and \\] escape the square brackets so glob treats [variant] and [locale]
    // as literal directory names rather than character classes.
    files: [
      'app/\\[variant\\]/\\[locale\\]/**/page.tsx',
      'app/\\[variant\\]/\\[locale\\]/**/layout.tsx',
    ],
    plugins: {
      'locale-route': {
        rules: { 'require-set-request-locale': requireSetRequestLocale },
      },
    },
    rules: {
      'locale-route/require-set-request-locale': 'error',
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
