import { test, expect } from '@playwright/test'
import { SEARCH_TERM } from './support/catalog'

test.describe('Search', () => {
  test('header search leads to a results page', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('banner')
      .getByRole('button', { name: 'What are you looking for?' })
      .click()

    const popup = page.getByRole('dialog', {
      name: 'What are you looking for?',
    })
    const input = popup.getByRole('textbox', {
      name: 'What are you looking for?',
    })
    await input.fill(SEARCH_TERM)
    await input.press('Enter')

    await expect(page).toHaveURL(new RegExp(`/search\\?q=${SEARCH_TERM}`))
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: new RegExp(`Your search results for: .${SEARCH_TERM}. \\(\\d+`),
      })
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /^View details for / }).first()
    ).toBeVisible()
  })

  test('add to basket from search results', async ({ page }) => {
    // Known bug: search results render AddToCart without variantId/variantCount.
    test.fail()

    await page.goto(`/search?q=${SEARCH_TERM}`)
    const addButton = page
      .getByRole('button', { name: 'Add to Basket' })
      .first()
    await expect(addButton).toBeVisible()

    const added = page.waitForResponse(
      (r) => r.url().includes('/cart/items') && r.request().method() === 'POST',
      { timeout: 5_000 }
    )
    await addButton.click()

    await added
  })
})
