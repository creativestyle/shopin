import { test, expect } from '@playwright/test'
import { searchFromHeader } from './support/actions'
import { miniCart, productList, searchResults } from './support/selectors'
import { ROUTES, TEST_DATA } from './support/test-data'

test.describe('Search', { tag: '@search' }, () => {
  test(
    'Header search leads to a results page',
    { tag: ['@desktop', '@priority-high', '@unverified'] },
    async ({ page }) => {
      const { term, onlyResult } = TEST_DATA.search
      await searchFromHeader(page, term)

      await expect(page).toHaveURL(ROUTES.search(term))
      await expect(searchResults.heading(page, term)).toBeVisible()
      await expect(productList.tile(page, onlyResult)).toBeVisible()
    }
  )

  test(
    'Add to basket from search results',
    { tag: ['@desktop', '@priority-medium', '@unverified'] },
    async ({ page }) => {
      test.fail(
        true,
        'Card link covers Add to Basket on search results; button has no variantId'
      )

      await page.goto(ROUTES.search(TEST_DATA.search.term))
      await expect(searchResults.addToBasket(page)).toBeVisible()

      await searchResults.addToBasket(page).click()

      await expect(miniCart.addedMessage(page)).toBeVisible()
    }
  )
})
