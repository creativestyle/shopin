import { test, expect } from '@playwright/test'
import { openProductFromCategory } from './support/actions'
import { pdp, productList } from './support/selectors'
import { TEST_DATA } from './support/test-data'

test.describe('Browse', { tag: '@browse' }, () => {
  test(
    'Category page lists products',
    { tag: ['@desktop', '@priority-high', '@unverified'] },
    async ({ page }) => {
      await page.goto(TEST_DATA.product.category)

      await expect(productList.tile(page, TEST_DATA.product.name)).toBeVisible()
    }
  )

  test(
    'Product tile opens the product page',
    { tag: ['@desktop', '@priority-high', '@unverified'] },
    async ({ page }) => {
      await openProductFromCategory(page)

      await expect(pdp.addToBasket(page)).toBeEnabled()
    }
  )

  test(
    'Selecting a variant option updates the URL',
    { tag: ['@desktop', '@priority-medium', '@unverified'] },
    async ({ page }) => {
      const { path, name, option } = TEST_DATA.variantProduct
      await page.goto(path)
      await expect(pdp.heading(page, name)).toBeVisible()

      await pdp.variantOption(page, option).click()

      await expect(page).toHaveURL(/variantId=\d+/)
      await expect(pdp.variantOption(page, option)).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    }
  )
})
