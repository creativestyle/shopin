import type {
  AttributeDefinitionApiResponse,
  AttributeApiResponse,
} from '../schemas/attribute'
import type { ProductVariantApiResponse } from '../schemas/product-variant'
import { stringifySelectableAttributeValue } from '../helpers/stringify-selectable-attribute-value'
import { isSelectableAttribute } from '../helpers/is-selectable-attribute'

export interface ShopinVariantAttributes {
  id: string
  attributes: Record<string, string>
}

export function mapVariantAttributes(
  variant: ProductVariantApiResponse,
  currentLanguage: string,
  defsByName?: Record<string, AttributeDefinitionApiResponse>
): Record<string, string> {
  const entries: Array<[string, string]> = (variant.attributes || [])
    .filter((attr: AttributeApiResponse) => {
      if (!defsByName) {
        return true
      }
      const def = defsByName[attr.name]
      // Only include selectable attributes when definitions are known
      return def ? isSelectableAttribute(def) : false
    })
    .map((attr: AttributeApiResponse) => {
      const value =
        stringifySelectableAttributeValue(
          attr.value as unknown,
          currentLanguage
        ) ?? ''
      return [attr.name, value]
    })

  return Object.fromEntries(entries)
}

export function mapVariantsToShopin(
  variants: ProductVariantApiResponse[],
  currentLanguage: string,
  defsByName?: Record<string, AttributeDefinitionApiResponse>
): ShopinVariantAttributes[] {
  const attributeValuesByName = new Map<string, Set<string>>()

  const mappedVariants = variants.map((variant) => {
    const attributes = mapVariantAttributes(
      variant,
      currentLanguage,
      defsByName
    )
    Object.entries(attributes).forEach(([name, value]) => {
      const set = attributeValuesByName.get(name) ?? new Set<string>()
      set.add(value)
      attributeValuesByName.set(name, set)
    })
    return { id: String(variant.id), attributes }
  })

  const varyingAttributeNames = new Set(
    Array.from(attributeValuesByName.entries())
      .filter(([, set]) => set.size > 1)
      .map(([name]) => name)
  )

  return mappedVariants.map((v) => ({
    id: v.id,
    attributes: Object.fromEntries(
      Object.entries(v.attributes).filter(([name]) =>
        varyingAttributeNames.has(name)
      )
    ),
  }))
}
