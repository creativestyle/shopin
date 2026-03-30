import { config } from '@core/prettier-config/base'

const prettierConfig = {
  ...config,
  plugins: [...(config.plugins || []), 'prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/style.css',
}

export default prettierConfig
