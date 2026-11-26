/**
 * The Algolia mappers: a hit becomes a product card in the request's language (prices, currency, fallbacks),
 * facet counts become facets with the display type their terms imply (color, size, text), and query helpers
 * build the per-language attribute keys, filters and sort replicas the sync writes.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import hitModule from '../dist/mappers/algolia-hit-to-product.js'
import facetsModule from '../dist/mappers/algolia-facets.js'
import facetUtils from '../dist/mappers/algolia-facet-utils.js'
import queryUtils from '../dist/mappers/algolia-query-utils.js'
import priceRangeModule from '../dist/mappers/algolia-price-range.js'

const { mapAlgoliaHitToProduct } = hitModule
const { mapAlgoliaFacets, mergeAlgoliaFacets } = facetsModule
const { inferDisplayType, extractColorHex, stripColorSuffix } = facetUtils
const {
  buildAlgoliaFieldNames,
  buildAlgoliaAttrKey,
  buildAlgoliaFacetFilters,
  buildAlgoliaNumericFilters,
  resolveAlgoliaSortIndex,
} = queryUtils
const { mapAlgoliaPriceRange } = priceRangeModule

test('a hit maps to a product card in the requested language', () => {
  const card = mapAlgoliaHitToProduct(
    {
      objectID: 'p1',
      name_en_US: 'Shirt',
      name_de_DE: 'Hemd',
      slug: { 'en-US': 'shirt', 'de-DE': 'hemd' },
      variantId: '3',
      variantCount: 4,
      imageUrl: 'https://img/1.jpg',
      price_de_DE_centAmount: 1999,
      price_de_DE_currency: 'EUR',
      price_de_DE_fractionDigits: 2,
      price_de_DE_discountedCentAmount: 1499,
      price_de_DE_rrpCentAmount: 2499,
      price_de_DE_omnibusCentAmount: 1799,
      price_en_US_centAmount: 2199,
    },
    'de-DE'
  )
  assert.deepEqual(card, {
    id: 'p1',
    name: 'Hemd',
    slug: 'hemd',
    image: { src: 'https://img/1.jpg', alt: 'Hemd' },
    price: {
      regularPriceInCents: 1999,
      currency: 'EUR',
      fractionDigits: 2,
      discountedPriceInCents: 1499,
      recommendedRetailPriceInCents: 2499,
      omnibusPriceInCents: 1799,
    },
    variantId: '3',
    variantCount: 4,
  })
})

test('a sparse hit falls back to defaults and the language currency, without optional prices', () => {
  const card = mapAlgoliaHitToProduct({ objectID: 'p2' }, 'en-US')
  assert.equal(card.name, 'Unnamed Product')
  assert.equal(card.slug, 'p2')
  assert.deepEqual(card.image, {
    src: '/images/product-image.png',
    alt: 'Unnamed Product',
  })
  assert.deepEqual(card.price, {
    regularPriceInCents: 0,
    currency: 'USD',
    fractionDigits: 2,
  })
})

test('the display type follows the terms: color, size, text', () => {
  const terms = (...t) => t.map((term) => ({ term, label: term, count: 1 }))
  assert.equal(
    inferDisplayType(terms('Red:#ff0000', 'navy', 'rgb(0,0,0)')),
    'color'
  )
  assert.equal(inferDisplayType(terms('S', 'xl', '42')), 'size')
  assert.equal(inferDisplayType(terms('S', 'cotton')), 'text')
  assert.equal(inferDisplayType([]), 'text')
})

test('color terms yield their hex or keyword and a label without the suffix', () => {
  assert.equal(extractColorHex('Red:#FF0000'), '#FF0000')
  assert.equal(extractColorHex('#abc'), '#abc')
  assert.equal(extractColorHex('Dark Blue = Navy'), 'navy')
  assert.equal(extractColorHex('Cotton'), undefined)
  assert.equal(stripColorSuffix('Red:#FF0000'), 'Red')
  assert.equal(stripColorSuffix('Dark Blue = navy'), 'Dark Blue')
  assert.equal(stripColorSuffix(' Plain '), 'Plain')
})

test('facets map per attribute with the localized key, label and color details', () => {
  const metadata = [
    {
      name: 'color',
      label: { 'en-US': 'Colour', 'de-DE': 'Farbe' },
      fieldType: 'lenum',
    },
    { name: 'size', label: { 'en-US': 'Size' }, fieldType: 'enum' },
    { name: 'material', label: { 'en-US': 'Material' }, fieldType: 'text' },
  ]
  const facets = mapAlgoliaFacets(
    {
      attr_color_de_DE: { 'Rot:#ff0000': 3, 'Blau:#0000ff': 1 },
      attr_color_en_US: { 'Red:#ff0000': 9 },
      attr_size: { S: 2, M: 5 },
      attr_material: {},
    },
    metadata,
    'de-DE'
  )
  assert.deepEqual(facets, [
    {
      name: 'color',
      label: 'Farbe',
      displayType: 'color',
      terms: [
        { term: 'Rot:#ff0000', label: 'Rot', count: 3, colorHex: '#ff0000' },
        { term: 'Blau:#0000ff', label: 'Blau', count: 1, colorHex: '#0000ff' },
      ],
    },
    {
      name: 'size',
      label: 'Size',
      displayType: 'size',
      terms: [
        { term: 'S', label: 'S', count: 2 },
        { term: 'M', label: 'M', count: 5 },
      ],
    },
  ])
  assert.deepEqual(mapAlgoliaFacets(undefined, metadata, 'de-DE'), [])
})

test('merged facets keep every option and take the filtered count, 0 when filtered out', () => {
  assert.deepEqual(
    mergeAlgoliaFacets(
      { attr_size: { S: 4, M: 6 }, attr_fit: { slim: 1 } },
      { attr_size: { M: 2 } }
    ),
    { attr_size: { S: 0, M: 2 }, attr_fit: { slim: 0 } }
  )
  const only = { attr_size: { S: 1 } }
  assert.equal(mergeAlgoliaFacets(undefined, only), only)
  assert.equal(mergeAlgoliaFacets(only, undefined), only)
})

test('field names and attribute keys are per language for localized types only', () => {
  assert.deepEqual(buildAlgoliaFieldNames('de-DE'), {
    langKey: 'de_DE',
    nameAttr: 'name_de_DE',
    priceField: 'price_de_DE_centAmount',
    discountedPriceField: 'price_de_DE_discountedCentAmount',
  })
  assert.equal(
    buildAlgoliaAttrKey('color', 'lenum', 'de_DE'),
    'attr_color_de_DE'
  )
  assert.equal(
    buildAlgoliaAttrKey('color', 'ltext', 'de_DE'),
    'attr_color_de_DE'
  )
  assert.equal(buildAlgoliaAttrKey('size', 'enum', 'de_DE'), 'attr_size')
})

test('facet filters OR values within an attribute and skip unknown or empty attributes', () => {
  const metadata = [
    { name: 'color', label: {}, fieldType: 'lenum' },
    { name: 'size', label: {}, fieldType: 'enum' },
  ]
  assert.deepEqual(
    buildAlgoliaFacetFilters(
      { color: ['Rot', 'Blau'], size: ['M'], unknown: ['x'], empty: [] },
      metadata,
      'de_DE'
    ),
    [['attr_color_de_DE:Rot', 'attr_color_de_DE:Blau'], ['attr_size:M']]
  )
  assert.deepEqual(buildAlgoliaFacetFilters(undefined, metadata, 'de_DE'), [])
})

test('numeric filters cover the price bounds and sale-only', () => {
  assert.deepEqual(buildAlgoliaNumericFilters('p', 'd', 100, 900, true), [
    'p >= 100',
    'p <= 900',
    'd > 0',
  ])
  assert.deepEqual(buildAlgoliaNumericFilters('p', 'd', 0), ['p >= 0'])
  assert.deepEqual(buildAlgoliaNumericFilters('p', 'd'), [])
})

test('each sort option resolves to its replica, anything else to the primary index', () => {
  assert.equal(
    resolveAlgoliaSortIndex('shop', 'price-asc', 'en-US'),
    'shop_price_en_US_asc'
  )
  assert.equal(
    resolveAlgoliaSortIndex('shop', 'price-desc', 'de-DE'),
    'shop_price_de_DE_desc'
  )
  assert.equal(
    resolveAlgoliaSortIndex('shop', 'newest', 'de-DE'),
    'shop_newest'
  )
  assert.equal(resolveAlgoliaSortIndex('shop', 'top-sellers', 'de-DE'), 'shop')
  assert.equal(resolveAlgoliaSortIndex('shop', undefined, 'de-DE'), 'shop')
})

test('the price range rounds outward and is absent without stats', () => {
  assert.deepEqual(
    mapAlgoliaPriceRange(
      { facets_stats: { p: { min: 10.7, max: 99.2 } } },
      'p'
    ),
    { minPriceInCents: 10, maxPriceInCents: 100 }
  )
  assert.equal(mapAlgoliaPriceRange({}, 'p'), undefined)
})
