import { config } from '@core/eslint-config/base'

export default [
  ...config,
  // the BFF scenarios require the BFF, the kit and the fixtures inside each isolated module registry
  {
    files: ['**/*.ts'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
]
