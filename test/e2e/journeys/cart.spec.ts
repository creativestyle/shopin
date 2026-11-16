import { test, expect } from '@playwright/test'
import {
  addTestProductToCart,
  addToCartFromPdp,
  increaseCartQuantity,
  openProductFromCategory,
  removeCartItem,
} from './support/actions'
import { t } from './support/i18n'
import { cartPage, header, miniCart } from './support/selectors'
import { ROUTES, TEST_DATA } from './support/test-data'

test.describe('Cart', { tag: '@cart' }, () => {
  test(
    'Adding from the product page opens the mini-cart',
    { tag: ['@desktop', '@priority-critical', '@unverified'] },
    async ({ page }) => {
      await openProductFromCategory(page)
      await addToCartFromPdp(page)

      await expect(miniCart.dialog(page)).toHaveAccessibleName(
        t('cart.titleWithCount', { count: 1 })
      )
      await expect(miniCart.item(page, TEST_DATA.product.name)).toBeVisible()
      await expect(miniCart.goToCart(page)).toBeVisible()
    }
  )

  test(
    'Header cart badge counts the added item',
    { tag: ['@desktop', '@priority-high', '@unverified'] },
    async ({ page }) => {
      await addTestProductToCart(page)

      await expect(header.cartLink(page)).toContainText('1')
    }
  )

  test(
    'Increasing the quantity updates the subtotal',
    { tag: ['@desktop', '@priority-high', '@unverified'] },
    async ({ page }) => {
      await addTestProductToCart(page)
      await page.goto(ROUTES.cart)
      await expect(cartPage.item(page, TEST_DATA.product.name)).toBeVisible()
      const subtotalBefore = await cartPage.summary(page).innerText()

      await increaseCartQuantity(page, 2)

      await expect(cartPage.quantity(page, 2)).toBeVisible()
      await expect(cartPage.summary(page)).not.toHaveText(subtotalBefore)
    }
  )

  test(
    'Removing the only item empties the cart',
    { tag: ['@desktop', '@priority-high', '@unverified'] },
    async ({ page }) => {
      await addTestProductToCart(page)
      await page.goto(ROUTES.cart)
      await expect(cartPage.heading(page)).toHaveText(
        t('cart.titleWithCount', { count: 1 })
      )

      await removeCartItem(page)

      await expect(cartPage.emptyMessage(page)).toBeVisible()
    }
  )
})
