import type { Facet } from '@core/contracts/product-collection/facet'
import type { ProductCardWithAttributes } from './shopin-product-cards'

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

/**
 * Builds facets with all options visible but counts reflecting filtered results.
 */
export function buildFacetsFromProducts(
  allProducts: ProductCardWithAttributes[],
  filteredProducts: ProductCardWithAttributes[]
): Facet[] {
  const allColors = new Set<string>()
  const allSizes = new Set<string>()
  const allMaterials = new Set<string>()
  const allBrands = new Set<string>()

  for (const product of allProducts) {
    allColors.add(product.attributes.color)
    allSizes.add(product.attributes.size)
    allMaterials.add(product.attributes.material)
    allBrands.add(product.attributes.brand)
  }

  const colorCounts = new Map<string, number>()
  const sizeCounts = new Map<string, number>()
  const materialCounts = new Map<string, number>()
  const brandCounts = new Map<string, number>()

  for (const product of filteredProducts) {
    const { color, size, material, brand } = product.attributes
    colorCounts.set(color, (colorCounts.get(color) || 0) + 1)
    sizeCounts.set(size, (sizeCounts.get(size) || 0) + 1)
    materialCounts.set(material, (materialCounts.get(material) || 0) + 1)
    brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1)
  }

  const mapToTerms = (allValues: Set<string>, counts: Map<string, number>) =>
    Array.from(allValues)
      .map((term) => ({
        term,
        label: term,
        count: counts.get(term) || 0,
      }))
      .sort((a, b) => a.term.localeCompare(b.term))

  const mapSizeToTerms = (
    allValues: Set<string>,
    counts: Map<string, number>
  ) =>
    Array.from(allValues)
      .map((term) => ({
        term,
        label: term,
        count: counts.get(term) || 0,
      }))
      .sort((a, b) => {
        const aIdx = SIZE_ORDER.indexOf(a.term)
        const bIdx = SIZE_ORDER.indexOf(b.term)
        if (aIdx !== -1 && bIdx !== -1) {
          return aIdx - bIdx
        }
        if (aIdx !== -1) {
          return -1
        }
        if (bIdx !== -1) {
          return 1
        }
        return a.term.localeCompare(b.term)
      })

  const mapColorToTerms = (
    allValues: Set<string>,
    counts: Map<string, number>
  ) =>
    Array.from(allValues)
      .map((term) => {
        const colonIdx = term.lastIndexOf(':')
        const label = colonIdx === -1 ? term : term.slice(0, colonIdx).trim()
        const colorHex =
          colonIdx === -1 ? '#888' : term.slice(colonIdx + 1).trim() || '#888'
        return {
          term,
          label,
          count: counts.get(term) || 0,
          colorHex,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))

  return [
    {
      name: 'color',
      label: 'Color',
      displayType: 'color' as const,
      terms: mapColorToTerms(allColors, colorCounts),
    },
    {
      name: 'size',
      label: 'Size',
      displayType: 'size' as const,
      terms: mapSizeToTerms(allSizes, sizeCounts),
    },
    {
      name: 'material',
      label: 'Material',
      displayType: 'text' as const,
      terms: mapToTerms(allMaterials, materialCounts),
    },
    {
      name: 'brand',
      label: 'Brand',
      displayType: 'text' as const,
      terms: mapToTerms(allBrands, brandCounts),
    },
  ].filter((facet) => facet.terms.length > 0)
}
