import type { ConfigurableOptionResponse } from '@core/contracts/product/configurable-option'
import type {
  ColorOptionItemResponse,
  ImageOptionItemResponse,
} from '@core/contracts/product/option-item'
import type { ShopinVariantAttributes } from './variants'
import { isCssColor, parseColorPair } from '../helpers/color-utils'

function buildOptionForAttribute(
  attributeName: string,
  values: Set<string>
): ConfigurableOptionResponse | undefined {
  const valueList = Array.from(values)
  return {
    key: attributeName,
    label: attributeName,
    type: 'string',
    options: valueList.map((label) => ({ label })),
  }
}

function buildColorOptionsForAttribute(
  attributeName: string,
  values: Set<string>
): ColorOptionItemResponse[] | undefined {
  const valueList = Array.from(values)
  const colorishOptions = valueList.map((value) => {
    const pair = parseColorPair(value)
    if (pair) {
      return { label: pair.label, swatch: pair.color }
    }
    if (isCssColor(value)) {
      return { label: value, swatch: value }
    }
    return null
  })
  const allColorish = colorishOptions.every((option) => option !== null)
  return allColorish
    ? (colorishOptions.filter(Boolean) as ColorOptionItemResponse[])
    : undefined
}

function buildImageOptionsForAttribute(
  attributeName: string,
  shopinVariants: ShopinVariantAttributes[],
  variantIdToImage?: Record<string, string>
): ImageOptionItemResponse[] | undefined {
  if (!variantIdToImage) {
    return undefined
  }
  const options = shopinVariants
    .map((shopinVariant) => {
      const label = shopinVariant.attributes[attributeName]
      const imageSrc = variantIdToImage[shopinVariant.id]
      if (!label || !imageSrc) {
        return null
      }
      return { label, imageSrc }
    })
    .filter(Boolean) as ImageOptionItemResponse[]

  // Deduplicate by label, keeping the first occurrence of each label
  const seenLabels = new Set<string>()
  const uniqueOptions = options.filter((option) => {
    if (seenLabels.has(option.label)) {
      return false
    }
    seenLabels.add(option.label)
    return true
  })

  // Require at least 2 distinct labels with images
  if (uniqueOptions.length <= 1) {
    return undefined
  }

  // Check if all images are unique - if not, don't use image selector
  // (it makes no sense to show the same image for different options)
  const imageSrcs = uniqueOptions.map((opt) => opt.imageSrc)
  const uniqueImageSrcs = new Set(imageSrcs)

  // Only use image selector if each option has a distinct image
  if (uniqueImageSrcs.size < uniqueOptions.length) {
    return undefined
  }

  return uniqueOptions
}

export function collectAttributeValuesByName(
  mappedVariants: ShopinVariantAttributes[]
): Map<string, Set<string>> {
  const attributeNameToValues = new Map<string, Set<string>>()
  mappedVariants.forEach((mappedVariant) => {
    Object.entries(mappedVariant.attributes).forEach(([name, value]) => {
      const set = attributeNameToValues.get(name) || new Set<string>()
      set.add(value)
      attributeNameToValues.set(name, set)
    })
  })
  return attributeNameToValues
}

export function mapConfigurableOptions(
  shopinVariants: ShopinVariantAttributes[],
  variantIdToImage?: Record<string, string>
): ConfigurableOptionResponse[] | undefined {
  const attrToValues = collectAttributeValuesByName(shopinVariants)

  const options: ConfigurableOptionResponse[] = []

  for (const [attributeName, values] of attrToValues.entries()) {
    if (values.size <= 1) {
      continue
    }
    const chosen = chooseConfigurableOptionForAttribute(
      attributeName,
      values,
      shopinVariants,
      variantIdToImage
    )
    if (chosen) {
      options.push(chosen)
    }
  }

  return options.length > 0 ? options : undefined
}

function chooseConfigurableOptionForAttribute(
  attributeName: string,
  values: Set<string>,
  shopinVariants: ShopinVariantAttributes[],
  variantIdToImage?: Record<string, string>
) {
  // Prefer image option when image mapping is provided and viable
  const imageOptions = buildImageOptionsForAttribute(
    attributeName,
    shopinVariants,
    variantIdToImage
  )
  if (imageOptions) {
    return {
      key: attributeName,
      label: attributeName,
      type: 'image' as const,
      options: imageOptions,
    }
  }

  // Next, prefer color when all values look colorish or label:color pairs
  const colorOptions = buildColorOptionsForAttribute(attributeName, values)
  if (colorOptions) {
    return {
      key: attributeName,
      label: attributeName,
      type: 'color' as const,
      options: colorOptions,
    }
  }

  return buildOptionForAttribute(attributeName, values)
}
