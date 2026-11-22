import { render, screen } from '@testing-library/react'
import type { ProductDetailsResponse } from '@core/contracts/product/product-details'
import { BuyBox } from '../buy-box'

jest.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))

const baseProduct: ProductDetailsResponse = {
  id: 'product-1',
  name: 'Shirt',
  slug: 'shirt',
  description: '',
  gallery: { images: [] },
}

async function renderBuyBox(product: ProductDetailsResponse) {
  render(
    await BuyBox({
      product,
      locale: 'de',
    })
  )
}

describe('BuyBox', () => {
  it('shows the price and the VAT note when the product has a price', async () => {
    await renderBuyBox({
      ...baseProduct,
      price: { regularPriceInCents: 2000, currency: 'EUR', fractionDigits: 2 },
    })

    expect(screen.getByText(/20,00\s€/)).toBeInTheDocument()
    expect(screen.getAllByText('buyBox.taxNote').length).toBeGreaterThan(0)
    expect(screen.queryByText('buyBox.notSoldHere')).not.toBeInTheDocument()
  })

  it('says the product is not sold in this store when it has no price', async () => {
    await renderBuyBox(baseProduct)

    expect(screen.getByText('buyBox.notSoldHere')).toBeInTheDocument()
    expect(screen.queryAllByText('buyBox.taxNote')).toHaveLength(0)
    expect(screen.queryByText(/€/)).not.toBeInTheDocument()
  })
})
