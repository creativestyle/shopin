import type {
  ProductProjection,
  ProductVariant,
  Price,
  ProductSearchResult,
} from '@commercetools/platform-sdk'

export function filterSaleOnlyResults(
  results: ProductSearchResult[]
): ProductSearchResult[] {
  return results.filter((r) => {
    const pp = r.productProjection as ProductProjection | undefined
    const allVariants = [pp?.masterVariant, ...(pp?.variants ?? [])].filter(
      Boolean
    ) as ProductVariant[]
    return allVariants.some((v) =>
      (v.prices ?? []).some((p: Price) => p.discounted != null)
    )
  })
}
