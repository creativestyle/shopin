import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import tailwind from 'eslint-plugin-tailwindcss'
import pluginQuery from '@tanstack/eslint-plugin-query'

const FEATURE_BOUNDARY_MESSAGE =
  'Import only feature entry points (files at the feature root). Do not import from any subdirectory of a feature.'

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
