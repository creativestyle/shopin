/**
 * The pure part of the commercetools → Algolia sync: which attributes are facets, how a product projection
 * becomes an Algolia record, and the index's facet and replica settings. No network: the CLI fetches and pushes.
 * The record fields are what @integrations/algolia-search reads (name_<lang>, price_<lang>_*, attr_*).
 */
import type {
  ProductProjection,
  ProductVariant,
  Attribute,
  Price,
  Image,
  CategoryReference,
  ProductType,
  AttributeDefinition,
  LocalizedString,
} from '@commercetools/platform-sdk'
import {
  FACETABLE_TYPES,
  EXCLUDED_ATTR_NAMES,
  LOCALIZED_ATTR_TYPES,
  I18N_CONFIG,
  getLocale,
} from '@config/constants'
import type { FacetableFieldType } from '@config/constants'

/** The shop's locales (config/locales.json): one localized field and one price per locale. */
export const LANGUAGES = I18N_CONFIG.supportedLocales

export interface FilterableAttribute {
  name: string
  label: LocalizedString
  fieldType: FacetableFieldType
}

/** The searchable attributes of a facetable type over all product types, each name once (first wins). */
export function selectFilterableAttributes(
  productTypes: ProductType[]
): FilterableAttribute[] {
  const seen = new Map<string, FilterableAttribute>()
  for (const pt of productTypes) {
    for (const attr of (pt.attributes ?? []) as AttributeDefinition[]) {
      if (seen.has(attr.name)) {
        continue
      }
      if (!attr.isSearchable) {
        continue
      }
      if (!FACETABLE_TYPES.has(attr.type.name as FacetableFieldType)) {
        continue
      }
      if (EXCLUDED_ATTR_NAMES.has(attr.name)) {
        continue
      }
      seen.set(attr.name, {
        name: attr.name,
        label: attr.label,
        fieldType: attr.type.name as FilterableAttribute['fieldType'],
      })
    }
  }
  return Array.from(seen.values())
}

export function extractVariantAttributes(
  variants: ProductVariant[],
  filterableAttributes: FilterableAttribute[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const attr of filterableAttributes) {
    const isEnum = attr.fieldType === 'enum' || attr.fieldType === 'lenum'
    const isLocalizedText = LOCALIZED_ATTR_TYPES.has(attr.fieldType)
    const isLocalizedEnum = attr.fieldType === 'lenum'

    if (isLocalizedText) {
      for (const lang of LANGUAGES) {
        const langKey = lang.replace('-', '_')
        const values = new Set<string>()
        for (const variant of variants) {
          const found: Attribute | undefined = variant.attributes?.find(
            (a: Attribute) => a.name === attr.name
          )
          if (found?.value == null) {
            continue
          }
          const localized = isLocalizedEnum
            ? (found.value as { label: LocalizedString }).label
            : (found.value as LocalizedString)
          const langVal = localized?.[lang]
          if (langVal) {
            values.add(String(langVal))
          }
        }
        if (values.size > 0) {
          result[`attr_${attr.name}_${langKey}`] = Array.from(values)
        }
      }
    } else {
      const values = new Set<string>()
      for (const variant of variants) {
        const found: Attribute | undefined = variant.attributes?.find(
          (a: Attribute) => a.name === attr.name
        )
        if (found?.value == null) {
          continue
        }

        if (isEnum) {
          const enumValue = found.value as { key?: string }
          if (enumValue.key) {
            values.add(String(enumValue.key))
          }
        } else {
          values.add(String(found.value))
        }
      }
      if (values.size > 0) {
        result[`attr_${attr.name}`] = Array.from(values)
      }
    }
  }

  return result
}

export function mapToAlgoliaRecord(
  product: ProductProjection,
  filterableAttributes: FilterableAttribute[]
): Record<string, unknown> {
  const masterVariant: ProductVariant = product.masterVariant
  const allVariants: ProductVariant[] = [
    masterVariant,
    ...(product.variants ?? []),
  ]
  const image: Image | undefined = masterVariant.images?.[0]
  const variantCount = allVariants.length

  const record: Record<string, unknown> = {
    objectID: product.id,
    slug: product.slug,
    variantId: String(masterVariant.id ?? 1),
    variantCount,
    imageUrl: image?.url || '/images/product-image.png',
    imageAlt: image?.label || 'Product image',
    createdAt: product.createdAt
      ? new Date(product.createdAt).getTime()
      : undefined,
  }

  for (const lang of LANGUAGES) {
    const name = product.name[lang]
    if (name) {
      record[`name_${lang.replace('-', '_')}`] = name
    }
  }

  if (product.description) {
    for (const lang of LANGUAGES) {
      const desc = product.description[lang]
      if (desc) {
        record[`description_${lang.replace('-', '_')}`] = desc
      }
    }
  }

  const categories = product.categories as CategoryReference[] | undefined
  if (categories?.length) {
    record.categoryIds = categories.map((c: CategoryReference) => c.id)
  }

  // Map prices per locale — prefer country-specific price, fall back to currency match
  const prices: Price[] = masterVariant.prices ?? []
  for (const lang of LANGUAGES) {
    const country = lang.split('-')[1]
    const currency = getLocale(lang).currency
    const prefix = `price_${lang.replace('-', '_')}`
    const selectedPrice: Price | undefined =
      prices.find((p: Price) => p.country === country) ??
      prices.find((p: Price) => !p.country && p.value.currencyCode === currency)

    if (!selectedPrice) {
      continue
    }

    record[`${prefix}_centAmount`] = selectedPrice.value.centAmount
    record[`${prefix}_currency`] = selectedPrice.value.currencyCode
    record[`${prefix}_fractionDigits`] = selectedPrice.value.fractionDigits ?? 2

    if (selectedPrice.discounted?.value?.centAmount != null) {
      record[`${prefix}_discountedCentAmount`] =
        selectedPrice.discounted.value.centAmount
    }

    const fields = selectedPrice.custom?.fields
    if (fields?.recommendedRetailPrice != null) {
      record[`${prefix}_rrpCentAmount`] = fields.recommendedRetailPrice
    }
    if (fields?.omnibusPrice != null) {
      record[`${prefix}_omnibusCentAmount`] = fields.omnibusPrice
    }
  }

  const attrFields = extractVariantAttributes(allVariants, filterableAttributes)
  Object.assign(record, attrFields)

  return record
}

export function buildFacetAttributes(
  filterableAttributes: FilterableAttribute[]
): string[] {
  const facetAttributes: string[] = []
  for (const a of filterableAttributes) {
    if (LOCALIZED_ATTR_TYPES.has(a.fieldType)) {
      for (const lang of LANGUAGES) {
        facetAttributes.push(`attr_${a.name}_${lang.replace('-', '_')}`)
      }
    } else {
      facetAttributes.push(`attr_${a.name}`)
    }
  }
  for (const lang of LANGUAGES) {
    const prefix = `price_${lang.replace('-', '_')}`
    facetAttributes.push(`filterOnly(${prefix}_centAmount)`)
    facetAttributes.push(`filterOnly(${prefix}_discountedCentAmount)`)
  }
  return facetAttributes
}

/** Virtual replicas for sorting: price and name per language, ascending and descending, plus newest. */
export function virtualReplicas(indexName: string): string[] {
  return replicaRankings(indexName).map((r) => `virtual(${r.indexName})`)
}

/** The custom ranking of each sort replica. */
export function replicaRankings(
  indexName: string
): { indexName: string; ranking: string[] }[] {
  const replicas: { indexName: string; ranking: string[] }[] = []
  for (const lang of LANGUAGES) {
    const langKey = lang.replace('-', '_')
    const priceField = `price_${langKey}_centAmount`
    const nameField = `name_${langKey}`
    replicas.push(
      {
        indexName: `${indexName}_price_${langKey}_asc`,
        ranking: [`asc(${priceField})`],
      },
      {
        indexName: `${indexName}_price_${langKey}_desc`,
        ranking: [`desc(${priceField})`],
      },
      {
        indexName: `${indexName}_name_${langKey}_asc`,
        ranking: [`asc(${nameField})`],
      },
      {
        indexName: `${indexName}_name_${langKey}_desc`,
        ranking: [`desc(${nameField})`],
      }
    )
  }
  replicas.push({
    indexName: `${indexName}_newest`,
    ranking: ['desc(createdAt)'],
  })
  return replicas
}
