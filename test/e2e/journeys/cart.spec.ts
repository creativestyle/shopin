import { test, expect } from '@playwright/test'
import {
  addFirstProductToCart,
  addToCartFromPdp,
  headerCartLink,
  openFirstProduct,
} from './support/actions'

test.describe('Cart', () => {
  test('adding from the product page opens the mini-cart', async ({ page }) => {
    const name = await openFirstProduct(page)
    const miniCart = await addToCartFromPdp(page)

    await expect(miniCart).toHaveAccessibleName('Cart (1)')
    await expect(miniCart.getByText(name).first()).toBeVisible()
    await expect(
      miniCart.getByRole('link', { name: 'Go to cart' })
    ).toBeVisible()

    await miniCart.getByRole('button', { name: 'Close' }).click()
    await expect(headerCartLink(page)).toContainText('1')
  })

  test('quantity can be changed and the item removed', async ({ page }) => {
    const name = await addFirstProductToCart(page)
    await page.goto('/cart')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cart (1)')
    await expect(page.getByRole('link', { name }).first()).toBeVisible()

    const subtotal = page.getByText('Subtotal', { exact: true }).locator('..')
    const subtotalBefore = await subtotal.innerText()

    const updated = page.waitForResponse(
      (r) => r.url().includes('/cart/items') && r.request().method() === 'PUT'
    )
    await page.getByRole('button', { name: 'Quantity: increase to 2' }).click()
    expect((await updated).ok()).toBe(true)

    await expect(
      page.getByRole('spinbutton', { name: 'Quantity: current value is 2' })
    ).toBeVisible()
    await expect(subtotal).not.toHaveText(subtotalBefore)

    await page.getByRole('button', { name: 'Remove item' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Remove', exact: true })
      .click()

    await expect(
      page.getByText('Your cart is currently empty.', { exact: false })
    ).toBeVisible()
  })
})
