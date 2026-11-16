import { test, expect } from '@playwright/test'
import {
  CATEGORY_WITH_SINGLE_VARIANT_PRODUCTS,
  MULTI_VARIANT_PRODUCT,
} from './support/catalog'
import { buyBox, openFirstProduct } from './support/actions'

test.describe('Browse', () => {
  test('category page lists products', async ({ page }) => {
    await page.goto(CATEGORY_WITH_SINGLE_VARIANT_PRODUCTS)

    await expect(
      page.getByRole('link', { name: /^View details for / }).first()
    ).toBeVisible()
  })

  test('product tile opens the product page', async ({ page }) => {
    await openFirstProduct(page)

    await expect(
      buyBox(page).getByRole('button', { name: 'Add to Basket' })
    ).toBeEnabled()
  })

  test('selecting a variant option updates the URL', async ({ page }) => {
    await page.goto(MULTI_VARIANT_PRODUCT.path)
    await expect(
      page.getByRole('heading', { level: 1, name: MULTI_VARIANT_PRODUCT.name })
    ).toBeVisible()

    const option = buyBox(page).getByRole('button', {
      name: MULTI_VARIANT_PRODUCT.option,
      exact: true,
    })
    await option.click()

    await expect(page).toHaveURL(/variantId=\d+/)
    await expect(option).toHaveAttribute('aria-pressed', 'true')
  })
})
