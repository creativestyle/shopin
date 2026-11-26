import { defineConfig, defineIntegration } from '@core/integration-kit'

/**
 * The shop config the BFF's unit tests see instead of config/shop (jest `moduleNameMapper`): one commerce
 * integration with every service, so a shop's own choices (another platform, a commerce without a wishlist) never
 * change what these tests check. Unit tests load no port; the scenario tests in test/category-split boot the BFF
 * with their own configs.
 */
const shop = defineIntegration({
  id: 'shop',
  label: 'Shop',
  ports: {
    commerce: () => {
      throw new Error('the BFF unit tests load no port')
    },
  },
})

export const config = defineConfig({ commerce: shop })
