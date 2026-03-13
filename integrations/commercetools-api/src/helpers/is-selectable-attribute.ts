import type { AttributeDefinitionApiResponse } from '../schemas/attribute'

export function isSelectableAttribute(
  def: AttributeDefinitionApiResponse
): boolean {
  // 1. Must be a Variant-level attribute to differentiate variants
  if (def.level !== 'Variant') {
    return false
  }

  // 2. If the attribute value is the same for all variants, it's not a selector
  if (def.attributeConstraint === 'SameForAll') {
    return false
  }

  const typeName = def.type?.name
  if (!typeName) {
    return false
  }

  // 3. Exclude 'set' types for typical single-choice variant selection
  // (If a variant is defined by a single value from a set, you'd typically extract that single value for selection)
  if (typeName === 'set') {
    return false
  }

  // 4. Include common types used for variant selection
  switch (typeName) {
    case 'text':
    case 'ltext':
    case 'enum':
    case 'lenum':
    case 'number':
    case 'boolean':
      return true
    default:
      return false // Exclude money, date, time, datetime, reference, nested, etc.
  }
}
