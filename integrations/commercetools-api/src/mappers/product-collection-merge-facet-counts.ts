import type {
  ProductSearchFacetResult,
  ProductSearchFacetResultBucket,
  ProductSearchFacetResultBucketEntry,
} from '@commercetools/platform-sdk'

export function mergeFacetCounts(
  mainFacets: ProductSearchFacetResult[] | undefined,
  countsFacets: ProductSearchFacetResult[] | undefined
): ProductSearchFacetResult[] | undefined {
  if (!countsFacets) {
    return mainFacets
  }

  return mainFacets?.map((f) => {
    const bf = f as ProductSearchFacetResultBucket
    const countFacet = countsFacets.find((cf) => cf.name === f.name) as
      | ProductSearchFacetResultBucket
      | undefined
    if (!countFacet || !bf.buckets) {
      return f
    }
    const countMap = new Map(
      countFacet.buckets?.map((b: ProductSearchFacetResultBucketEntry) => [
        b.key,
        b.count,
      ]) ?? []
    )
    return {
      ...f,
      buckets: bf.buckets.map((b: ProductSearchFacetResultBucketEntry) => ({
        ...b,
        count: countMap.get(b.key) ?? 0,
      })),
    }
  })
}
