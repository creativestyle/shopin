import { test, expect } from '@playwright/test'
import { buyBox, openFirstProduct } from './support/actions'

test.describe('Wishlist', () => {
  test('guest can save and remove a product', async ({ page }) => {
    const name = await openFirstProduct(page)

    await buyBox(page).getByRole('button', { name: 'Save to wishlist' }).click()
    await expect(page.getByText('Added to wishlist')).toBeVisible()
    await expect(
      buyBox(page).getByRole('button', { name: 'Remove from wishlist' })
    ).toBeVisible()

    await page.goto('/wishlist')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Wishlist (1 item)'
    )
    const tile = page.getByRole('link', { name: `View details for ${name}` })
    await expect(tile).toBeVisible()

    await page.getByRole('button', { name: 'Remove from wishlist' }).click()

    await expect(
      page.getByText('Your wishlist is empty. Start adding products you love!')
    ).toBeVisible()
  })
})
