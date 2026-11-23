import { CartService } from '@integrations/commercetools-api'

const colorDef = {
  name: 'color',
  label: { 'en-US': 'Color', 'de-DE': 'Farbe' },
  type: { name: 'lenum' },
  level: 'Variant' as const,
}
const sizeDef = {
  name: 'size',
  label: { 'en-US': 'Size', 'de-DE': 'Größe' },
  type: { name: 'enum' },
  level: 'Variant' as const,
}

function variant(id: number, color: string, size: string) {
  return {
    id,
    sku: `sku-${id}`,
    attributes: [
      {
        name: 'color',
        value: { key: color, label: { 'en-US': color, 'de-DE': color } },
      },
      { name: 'size', value: { key: size, label: size } },
    ],
  }
}

type Variant = ReturnType<typeof variant>

function lineItem(lineVariant: Variant, product?: unknown) {
  return {
    id: 'line-1',
    productId: 'product-1',
    name: { 'en-US': 'Shirt', 'de-DE': 'Hemd' },
    quantity: 1,
    variant: lineVariant,
    ...(product !== undefined && { product }),
    price: { value: { centAmount: 1000, currencyCode: 'EUR' } },
  }
}

// The line item product as `lineItems[*].product(.productType)` expands it
function expandedProduct(variants: Variant[]) {
  const [masterVariant, ...rest] = variants
  return {
    id: 'product-1',
    masterData: {
      current: {
        slug: { 'en-US': 'shirt', 'de-DE': 'hemd' },
        masterVariant,
        variants: rest,
      },
    },
    productType: {
      typeId: 'product-type',
      id: 'type-1',
      obj: { attributes: [colorDef, sizeDef] },
    },
  }
}

function createService(language: string, lineItems: unknown[]) {
  const cart = {
    id: 'cart-1',
    version: 1,
    lineItems,
    totalPrice: { centAmount: 1000, currencyCode: 'EUR' },
  }
  const client = {
    me: () => ({
      carts: () => ({
        withId: () => ({
          get: () => ({
            execute: jest.fn().mockResolvedValue({ body: cart }),
          }),
        }),
      }),
    }),
  }
  const serverGetClient = jest.fn()
  const service = new CartService(
    { getClient: async () => client } as never,
    { getClient: serverGetClient } as never,
    { getCurrentLanguage: () => language } as never
  )
  return { service, serverGetClient }
}

describe('CommercetoolsCartService line item variant attributes', () => {
  it('lists only the attributes that differ across variants, without a product query', async () => {
    const red = variant(1, 'Red', 'M')
    const blue = variant(2, 'Blue', 'M')
    const { service, serverGetClient } = createService('en-US', [
      lineItem(blue, expandedProduct([red, blue])),
    ])

    const cart = await service.getCart('cart-1', { withInventory: false })

    expect(cart.lineItems[0]?.variantAttributes).toEqual([
      { name: 'color', label: 'Color', value: 'Blue' },
    ])
    expect(serverGetClient).not.toHaveBeenCalled()
  })

  it('localizes labels from the product type', async () => {
    const red = variant(1, 'Rot', 'M')
    const blueLarge = variant(2, 'Blau', 'L')
    const { service } = createService('de-DE', [
      lineItem(blueLarge, expandedProduct([red, blueLarge])),
    ])

    const cart = await service.getCart('cart-1', { withInventory: false })

    expect(cart.lineItems[0]?.variantAttributes).toEqual([
      { name: 'color', label: 'Farbe', value: 'Blau' },
      { name: 'size', label: 'Größe', value: 'L' },
    ])
  })

  it('lists nothing for a single-variant product', async () => {
    const only = variant(1, 'Red', 'M')
    const { service } = createService('en-US', [
      lineItem(only, expandedProduct([only])),
    ])

    const cart = await service.getCart('cart-1', { withInventory: false })

    expect(cart.lineItems[0]?.variantAttributes).toBeUndefined()
  })

  it('keeps color/size keyed by name, and no variant attributes, without the expanded product', async () => {
    const { service } = createService('en-US', [
      lineItem(variant(1, 'Red', 'M')),
    ])

    const cart = await service.getCart('cart-1', { withInventory: false })

    expect(cart.lineItems[0]?.attributes).toEqual({ color: 'Red', size: 'M' })
    expect(cart.lineItems[0]?.variantAttributes).toBeUndefined()
  })
})
