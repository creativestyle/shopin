import { config } from '@core/eslint-config/base'

export default [
  ...config,
  {
    ignores: ['dist/**', '**/dist/**'],
  },
]
