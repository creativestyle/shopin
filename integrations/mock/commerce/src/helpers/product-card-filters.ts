import type { Filters } from '@core/contracts/product-collection/product-collection-page'
import type { ProductCardWithAttributes } from '../generators'

export interface ProductCardFilterOptions {
  filters?: Filters
  saleOnly?: boolean
  priceMin?: number
  priceMax?: number
}

function getEffectivePrice(
  product: ProductCardWithAttributes
): number | undefined {
  if (!product.price) {
    return undefined
  }
  return (
    product.price.discountedPriceInCents ?? product.price.regularPriceInCents
  )
}

export function calculatePriceRange(products: ProductCardWithAttributes[]): {
  minPriceInCents: number
  maxPriceInCents: number
} {
  const prices = products
    .map(getEffectivePrice)
    .filter((price): price is number => price !== undefined)
  if (prices.length === 0) {
    return { minPriceInCents: 0, maxPriceInCents: 0 }
  }
  return {
    minPriceInCents: Math.min(...prices),
    maxPriceInCents: Math.max(...prices),
  }
}

function matchesAttributeFilters(
  product: ProductCardWithAttributes,
  filters: NonNullable<Filters>
): boolean {
  for (const [attrName, values] of Object.entries(filters)) {
    if (!values || values.length === 0) {
      continue
    }

    const productValue =
      product.attributes[attrName as keyof typeof product.attributes]
    if (!productValue) {
      continue
    }

    // Exact match since values include format like "White:#FFFFFF"
    if (!values.some((v) => v === productValue)) {
      return false
    }
  }
  return true
}

export function filterProductCards(
  products: ProductCardWithAttributes[],
  { filters, saleOnly, priceMin, priceMax }: ProductCardFilterOptions
): ProductCardWithAttributes[] {
  return products.filter((product) => {
    if (filters && !matchesAttributeFilters(product, filters)) {
      return false
    }
    if (saleOnly && product.price?.discountedPriceInCents === undefined) {
      return false
    }
    if (priceMin === undefined && priceMax === undefined) {
      return true
    }
    const price = getEffectivePrice(product)
    if (price === undefined) {
      return false
    }
    if (priceMin !== undefined && price < priceMin) {
      return false
    }
    if (priceMax !== undefined && price > priceMax) {
      return false
    }
    return true
  })
}
