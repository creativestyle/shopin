import * as React from 'react'
import type { ConfigurableOptionResponse } from '@core/contracts/product/configurable-option'
import type { ProductDetailsResponse } from '@core/contracts/product/product-details'
import { buildSelectionFromVariantId } from './helpers'
import { useVariantUrl } from './use-variant-url'

export function useConfigurableSelection(
  options: ConfigurableOptionResponse[] | undefined,
  variants: ProductDetailsResponse['variants'] | undefined
) {
  const resolvedOptions = options ?? []
  const { updateUrl, variantId } = useVariantUrl()

  const optionKeys = resolvedOptions.map((o) => o.key)
  const currentSelectionFromVariant = buildSelectionFromVariantId(
    variantId,
    variants,
    resolvedOptions
  )

  const variantMatchesSelection = (
    variant: NonNullable<typeof variants>[number],
    selection: Record<string, string>
  ) => {
    return Object.entries(selection).every(
      ([attributeKey, selectedValue]) =>
        variant.attributes?.[attributeKey] === selectedValue
    )
  }

  const isCandidateAvailable = (
    optionKey: string,
    candidateValue: string,
    currentSelection: Record<string, string>
  ) => {
    if (!variants || variants.length === 0) {
      return true
    }
    const testSelection = { ...currentSelection, [optionKey]: candidateValue }
    return variants.some((variant) =>
      variantMatchesSelection(variant, testSelection)
    )
  }

  const [internalSelected, setInternalSelected] = React.useState<
    Record<string, string>
  >(() =>
    Object.keys(currentSelectionFromVariant).length > 0
      ? currentSelectionFromVariant
      : {}
  )

  React.useEffect(() => {
    if (!variantId || Object.keys(currentSelectionFromVariant).length === 0) {
      return
    }

    setInternalSelected(currentSelectionFromVariant)
  }, [variantId, currentSelectionFromVariant])

  const handleChange = (key: string, value: string) => {
    const nextSelection = { ...internalSelected }
    const isDeselecting = internalSelected[key] === value
    if (isDeselecting) {
      delete nextSelection[key]
    } else {
      nextSelection[key] = value
    }
    setInternalSelected(nextSelection)

    if (isDeselecting) {
      updateUrl()
      return
    }

    const allSelected =
      optionKeys.length > 0 && optionKeys.every((k) => !!nextSelection[k])
    if (allSelected && variants && variants.length > 0) {
      const matchingVariants = variants.filter((variant) =>
        variantMatchesSelection(variant, nextSelection)
      )
      if (matchingVariants.length === 1) {
        const matchedVariantId = matchingVariants[0]?.id
        if (matchedVariantId) {
          updateUrl(matchedVariantId)
          return
        }
      }
      updateUrl()
      return
    }

    updateUrl()
  }

  return {
    selection: internalSelected,
    setSelection: setInternalSelected,
    handleChange,
    isCandidateAvailable,
  }
}
