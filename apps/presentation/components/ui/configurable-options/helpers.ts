import type { ConfigurableOptionResponse } from '@core/contracts/product/configurable-option'
import type { ProductDetailsResponse } from '@core/contracts/product/product-details'

/**
 * Builds a selection map (attribute key -> option value) from a given variant id.
 *
 * Matches strictly by exact option value only. Returns an empty object when no
 * match or not enough context is provided.
 */
export function buildSelectionFromVariantId(
  variantId: string | null | undefined,
  variants: ProductDetailsResponse['variants'] | undefined,
  options: ConfigurableOptionResponse[]
): Record<string, string> {
  if (!variantId || !variants || variants.length === 0) {
    return {}
  }
  const matchedVariant = variants.find((variant) => variant.id === variantId)
  if (!matchedVariant) {
    return {}
  }
  // Filter variant attributes to only include keys that correspond to configurable options,
  // excluding any non-selectable attributes that might exist in the variant
  const selectionByKey: Record<string, string> = {}
  options.forEach((optionDefinition) => {
    const attributeValue = matchedVariant.attributes?.[optionDefinition.key]
    if (attributeValue) {
      selectionByKey[optionDefinition.key] = attributeValue
    }
  })
  return selectionByKey
}
