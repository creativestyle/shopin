import type { Page } from '@playwright/test'
import { countryName, escapeRegExp, t, tPattern } from './i18n'

const startsWith = (text: string) => new RegExp(`^${escapeRegExp(text)}`)

export const header = {
  cartLink: (page: Page) =>
    page
      .getByRole('banner')
      .getByRole('link', { name: startsWith(t('userMenu.cart')) }),
  searchButton: (page: Page) =>
    page
      .getByRole('banner')
      .getByRole('button', { name: t('common.searchPlaceholder') }),
}

export const searchPopup = {
  input: (page: Page) =>
    page
      .getByRole('dialog', { name: t('common.searchPlaceholder') })
      .getByRole('textbox', { name: t('common.searchPlaceholder') }),
}

export const searchResults = {
  heading: (page: Page, term: string) =>
    page.getByRole('heading', {
      level: 1,
      name: new RegExp(
        `^${escapeRegExp(t('searchResults.titlePrefix'))} .${escapeRegExp(term)}. \\(\\d+ ${escapeRegExp(t('searchResults.articles'))}\\)$`
      ),
    }),
  // Search results render no product cards of their own; the term yields one result.
  addToBasket: (page: Page) =>
    page.getByRole('main').getByRole('button', {
      name: t('product.buyBox.addToBasket'),
    }),
}

export const productList = {
  anyTile: (page: Page) =>
    page.getByRole('link', { name: tPattern('productCard.linkAriaLabel') }),
  tile: (page: Page, name: string) =>
    page.getByRole('link', {
      name: t('productCard.linkAriaLabel', { name }),
      exact: true,
    }),
}

export const pdp = {
  heading: (page: Page, name: string) =>
    page.getByRole('heading', { level: 1, name, exact: true }),
  buyBox: (page: Page) =>
    page.getByRole('complementary').filter({
      has: page.getByRole('button', { name: t('product.buyBox.addToBasket') }),
    }),
  addToBasket: (page: Page) =>
    pdp
      .buyBox(page)
      .getByRole('button', { name: t('product.buyBox.addToBasket') }),
  saveToWishlist: (page: Page) =>
    pdp
      .buyBox(page)
      .getByRole('button', { name: t('product.buyBox.wishlistSaveAria') }),
  removeFromWishlist: (page: Page) =>
    pdp
      .buyBox(page)
      .getByRole('button', { name: t('product.buyBox.wishlistRemoveAria') }),
  variantOption: (page: Page, label: string) =>
    pdp.buyBox(page).getByRole('button', { name: label, exact: true }),
}

export const miniCart = {
  dialog: (page: Page) =>
    page.getByRole('dialog', { name: tPattern('cart.titleWithCount') }),
  addedMessage: (page: Page) =>
    miniCart.dialog(page).getByText(t('cart.addToCartModal.toastMessage')),
  item: (page: Page, name: string) =>
    miniCart.dialog(page).getByRole('link', { name, exact: true }),
  goToCart: (page: Page) =>
    miniCart
      .dialog(page)
      .getByRole('link', { name: t('cart.addToCartModal.goToCart') }),
  close: (page: Page) =>
    miniCart.dialog(page).getByRole('button', { name: t('common.close') }),
}

const quantityLabel = () => t('cart.item.quantity')

export const cartPage = {
  heading: (page: Page) => page.getByRole('heading', { level: 1 }),
  item: (page: Page, name: string) =>
    page.getByRole('main').getByRole('link', { name, exact: true }),
  increaseQuantity: (page: Page, to: number) =>
    page.getByRole('button', {
      name: t('common.quantitySwitcher.increaseTo', {
        label: quantityLabel(),
        value: to,
      }),
    }),
  quantity: (page: Page, value: number) =>
    page.getByRole('spinbutton', {
      name: t('common.quantitySwitcher.currentValue', {
        label: quantityLabel(),
        value,
      }),
    }),
  // The summary is the polite live region holding the subtotal row.
  summary: (page: Page) =>
    page
      .locator('[aria-live="polite"]')
      .filter({ hasText: t('cart.summary.subtotal') }),
  removeItem: (page: Page) =>
    page.getByRole('button', { name: t('cart.item.removeAction') }),
  confirmRemoval: (page: Page) =>
    page.getByRole('alertdialog').getByRole('button', {
      name: t('cart.item.removeConfirmation.confirm'),
      exact: true,
    }),
  emptyMessage: (page: Page) => page.getByText(t('cart.empty.message')),
  checkout: (page: Page) =>
    page
      .getByRole('main')
      .getByRole('link', { name: t('cart.checkout'), exact: true }),
}

const continueTo = (page: Page, stepKey: string) =>
  page.getByRole('button', {
    name: t('checkout.steps.continueTo', {
      step: t(`checkout.steps.${stepKey}.title`),
    }),
  })

export const checkout = {
  orderAsGuest: (page: Page) =>
    page.getByRole('button', { name: t('checkout.guest.button') }),
  billingForm: (page: Page) => page.locator('#billing-address-form'),
  field: (page: Page, field: string) =>
    checkout.billingForm(page).getByLabel(t(`address.form.fields.${field}`)),
  countrySelect: (page: Page) =>
    checkout
      .billingForm(page)
      .getByRole('combobox', { name: t('address.form.fields.country') }),
  countryOption: (page: Page, code: string) =>
    page.getByRole('option', { name: countryName(code), exact: true }),
  continueToShipping: (page: Page) => continueTo(page, 'shipping'),
  sameAsBilling: (page: Page) =>
    page.getByRole('checkbox', { name: t('checkout.shipping.sameAsBilling') }),
  continueToDeliveryMethod: (page: Page) => continueTo(page, 'deliveryMethod'),
  deliveryMethods: (page: Page) => page.getByRole('radiogroup'),
  continueToPayment: (page: Page) => continueTo(page, 'payment'),
  paymentMethod: (page: Page, label: string) =>
    page.getByRole('radio', { name: startsWith(label) }),
  continueToReview: (page: Page) => continueTo(page, 'review'),
  acceptTerms: (page: Page) =>
    page.getByRole('checkbox', {
      name: t('checkout.steps.review.acceptTerms'),
    }),
  buyNow: (page: Page) =>
    page.getByRole('button', { name: t('checkout.steps.review.buyNow') }),
  termsRequired: (page: Page) =>
    page.getByText(t('checkout.steps.review.termsRequired')),
  paymentFailed: (page: Page) =>
    page.getByText(t('checkout.steps.review.paymentFailure')),
}

// The demo payment provider page is not translated.
export const mockedPayment = {
  payNow: (page: Page) => page.getByRole('button', { name: 'Pay Now' }),
  simulateFailure: (page: Page) =>
    page.getByRole('button', { name: 'Simulate Failed Payment' }),
}

export const orderComplete = {
  heading: (page: Page) =>
    page.getByRole('heading', {
      level: 1,
      name: t('checkout.complete.thankYou'),
    }),
  confirmation: (page: Page, email: string) =>
    page.getByText(
      tPattern('checkout.complete.confirmationMessage', { email })
    ),
}

export const wishlistPage = {
  heading: (page: Page) => page.getByRole('heading', { level: 1 }),
  removeItem: (page: Page) =>
    page
      .getByRole('main')
      .getByRole('button', { name: t('product.buyBox.wishlistRemoveAria') }),
  emptyMessage: (page: Page) => page.getByText(t('wishlist.emptyMessage')),
}

export const toast = {
  addedToWishlist: (page: Page) =>
    page.getByRole('status').filter({ hasText: t('wishlist.addSuccess') }),
}
