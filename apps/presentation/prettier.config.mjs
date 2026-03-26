import { config } from '@core/prettier-config/base'

const prettierConfig = {
  ...config,
  plugins: [...(config.plugins || []), 'prettier-plugin-tailwindcss'],
  tailwindStylesheet: './app/globals.css',
}

export default prettierConfig
