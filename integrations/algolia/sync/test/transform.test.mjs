/**
 * The sync's transform, without network: which product-type attributes become facets, how a published
 * product projection becomes an Algolia record (names, prices per language with country before currency
 * match, facet attributes), and the facet and replica settings the search side (algolia-api) relies on.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import transform from '../dist/scripts/lib/transform.js'

const {
  selectFilterableAttributes,
  mapToAlgoliaRecord,
  buildFacetAttributes,
  virtualReplicas,
  replicaRankings,
} = transform

const attr = (name, type, isSearchable = true) => ({
  name,
  label: { 'en-US': name },
  type: { name: type },
  isSearchable,
})

test('facets are the searchable attributes of a facetable type, excluded names left out, each once', () => {
  const selected = selectFilterableAttributes([
    {
      attributes: [
        attr('color', 'lenum'),
        attr('size', 'enum'),
        attr('weight', 'number'),
        attr('internal', 'text', false),
        attr('product-description', 'ltext'),
      ],
    },
    { attributes: [attr('color', 'text'), attr('material', 'ltext')] },
    {},
  ])
  assert.deepEqual(
    selected.map((a) => [a.name, a.fieldType]),
    [
      ['color', 'lenum'],
      ['size', 'enum'],
      ['material', 'ltext'],
    ]
  )
})

const price = (centAmount, currencyCode, extra = {}) => ({
  value: { centAmount, currencyCode, fractionDigits: 2 },
  ...extra,
})

const product = {
  id: 'p1',
  slug: { 'en-US': 'shirt', 'de-DE': 'hemd' },
  name: { 'en-US': 'Shirt', 'de-DE': 'Hemd' },
  description: { 'en-US': 'A shirt' },
  createdAt: '2026-01-02T03:04:05.000Z',
  categories: [{ id: 'c1' }, { id: 'c2' }],
  masterVariant: {
    id: 7,
    images: [{ url: 'https://img/1.jpg', label: 'Front' }],
    prices: [
      price(1000, 'EUR'),
      price(1200, 'EUR', {
        country: 'DE',
        discounted: { value: { centAmount: 900 } },
        custom: { fields: { recommendedRetailPrice: 1500, omnibusPrice: 950 } },
      }),
      price(2000, 'USD'),
    ],
    attributes: [
      {
        name: 'color',
        value: { key: 'red', label: { 'en-US': 'Red', 'de-DE': 'Rot' } },
      },
      { name: 'size', value: { key: 'm' } },
    ],
  },
  variants: [
    {
      id: 8,
      attributes: [
        { name: 'color', value: { key: 'blue', label: { 'en-US': 'Blue' } } },
        { name: 'size', value: { key: 'm' } },
      ],
    },
  ],
}
const filterable = [
  { name: 'color', label: {}, fieldType: 'lenum' },
  { name: 'size', label: {}, fieldType: 'enum' },
]

test('a product becomes one record with names, prices and facet values per language', () => {
  assert.deepEqual(mapToAlgoliaRecord(product, filterable), {
    objectID: 'p1',
    slug: product.slug,
    variantId: '7',
    variantCount: 2,
    imageUrl: 'https://img/1.jpg',
    imageAlt: 'Front',
    createdAt: Date.parse('2026-01-02T03:04:05.000Z'),
    name_en_US: 'Shirt',
    name_de_DE: 'Hemd',
    description_en_US: 'A shirt',
    categoryIds: ['c1', 'c2'],
    // en-US: no US country price, so the USD price without a country
    price_en_US_centAmount: 2000,
    price_en_US_currency: 'USD',
    price_en_US_fractionDigits: 2,
    // de-DE: the DE country price wins over the EUR price without a country
    price_de_DE_centAmount: 1200,
    price_de_DE_currency: 'EUR',
    price_de_DE_fractionDigits: 2,
    price_de_DE_discountedCentAmount: 900,
    price_de_DE_rrpCentAmount: 1500,
    price_de_DE_omnibusCentAmount: 950,
    attr_color_en_US: ['Red', 'Blue'],
    attr_color_de_DE: ['Rot'],
    attr_size: ['m'],
  })
})

test('a product without images or matching prices gets the placeholder image and no price fields', () => {
  const record = mapToAlgoliaRecord(
    {
      id: 'p2',
      slug: {},
      name: { 'en-US': 'Bare' },
      masterVariant: { id: 1, prices: [price(500, 'GBP')] },
    },
    filterable
  )
  assert.equal(record.imageUrl, '/images/product-image.png')
  assert.equal(record.imageAlt, 'Product image')
  assert.equal(
    Object.keys(record).some(
      (k) => k.startsWith('price_') || k.startsWith('attr_')
    ),
    false
  )
})

test('facet settings list localized attributes per language and the price fields as filter-only', () => {
  assert.deepEqual(buildFacetAttributes(filterable), [
    'attr_color_en_US',
    'attr_color_de_DE',
    'attr_size',
    'filterOnly(price_en_US_centAmount)',
    'filterOnly(price_en_US_discountedCentAmount)',
    'filterOnly(price_de_DE_centAmount)',
    'filterOnly(price_de_DE_discountedCentAmount)',
  ])
})

test('one virtual replica per sort, each ranked by its field', () => {
  assert.deepEqual(virtualReplicas('shop'), [
    'virtual(shop_price_en_US_asc)',
    'virtual(shop_price_en_US_desc)',
    'virtual(shop_name_en_US_asc)',
    'virtual(shop_name_en_US_desc)',
    'virtual(shop_price_de_DE_asc)',
    'virtual(shop_price_de_DE_desc)',
    'virtual(shop_name_de_DE_asc)',
    'virtual(shop_name_de_DE_desc)',
    'virtual(shop_newest)',
  ])
  const ranking = Object.fromEntries(
    replicaRankings('shop').map((r) => [r.indexName, r.ranking])
  )
  assert.deepEqual(ranking.shop_price_de_DE_desc, [
    'desc(price_de_DE_centAmount)',
  ])
  assert.deepEqual(ranking.shop_name_en_US_asc, ['asc(name_en_US)'])
  assert.deepEqual(ranking.shop_newest, ['desc(createdAt)'])
})
