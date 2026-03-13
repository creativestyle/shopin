import { config } from '@core/eslint-config/base'
import tailwind from 'eslint-plugin-tailwindcss'

export default [
  ...config,
  ...tailwind.configs['flat/recommended'],
  {
    settings: {
      tailwindcss: {
        config: process.cwd() + '/src/style.css',
      },
    },
    rules: {
      'tailwindcss/no-custom-classname': 'off',
    },
  },
  {
    ignores: ['storybook-static/**'],
  },
]
