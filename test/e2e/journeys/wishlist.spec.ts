import { test, expect } from '@playwright/test'
import {
  openProductFromCategory,
  saveTestProductToWishlist,
} from './support/actions'
import { t } from './support/i18n'
import { pdp, productList, toast, wishlistPage } from './support/selectors'
import { ROUTES, TEST_DATA } from './support/test-data'

test.describe('Wishlist', { tag: '@wishlist' }, () => {
  test(
    'Guest saves a product from the product page',
    { tag: ['@desktop', '@priority-medium', '@unverified'] },
    async ({ page }) => {
      await openProductFromCategory(page)

      await pdp.saveToWishlist(page).click()

      await expect(toast.addedToWishlist(page)).toBeVisible()
      await expect(pdp.removeFromWishlist(page)).toBeVisible()
    }
  )

  test(
    'Wishlist page lists the saved product',
    { tag: ['@desktop', '@priority-medium', '@unverified'] },
    async ({ page }) => {
      await saveTestProductToWishlist(page)

      await page.goto(ROUTES.wishlist)

      await expect(wishlistPage.heading(page)).toHaveText(
        `${t('wishlist.title')} (1 ${t('wishlist.item')})`
      )
      await expect(productList.tile(page, TEST_DATA.product.name)).toBeVisible()
    }
  )

  test(
    'Removing the only product empties the wishlist',
    { tag: ['@desktop', '@priority-medium', '@unverified'] },
    async ({ page }) => {
      await saveTestProductToWishlist(page)
      await page.goto(ROUTES.wishlist)

      await wishlistPage.removeItem(page).click()

      await expect(wishlistPage.emptyMessage(page)).toBeVisible()
    }
  )
})
