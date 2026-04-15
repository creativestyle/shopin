/**
 * Sections content models (Top Bar, Footer).
 */
import type { ContentTypeDefinition, FieldSpec } from '../lib/content-type'

export const LAYOUT_DEFINITIONS: ContentTypeDefinition[] = [
  {
    id: 'topBar',
    name: 'Top Bar',
    description: 'Singleton: top bar messages only (no navigation links)',
    displayField: 'topBarMessages',
    fields: [
      {
        id: 'topBarMessages',
        spec: { type: 'Text', name: 'Top bar messages', localized: true },
      },
    ],
  },
  {
    id: 'footerSection',
    name: 'Footer Section',
    description: 'Footer column with title and links',
    displayField: 'title',
    fields: [
      {
        id: 'title',
        spec: {
          type: 'Symbol',
          name: 'Title',
          required: true,
          localized: true,
        },
      },
      {
        id: 'links',
        spec: {
          type: 'Array',
          name: 'Links',
          localized: false,
          items: {
            type: 'Link',
            linkType: 'Entry',
            validations: [{ linkContentType: ['link'] }],
          },
        },
      },
    ],
  },
  {
    id: 'footer',
    name: 'Footer',
    description: 'Singleton: footer sections, legal links, copyright',
    displayField: 'copyright',
    fields: [
      {
        id: 'footerLinks',
        spec: {
          type: 'Array',
          name: 'Footer links',
          localized: false,
          items: {
            type: 'Link',
            linkType: 'Entry',
            validations: [{ linkContentType: ['footerSection'] }],
          },
        },
      },
      {
        id: 'legalLinks',
        spec: {
          type: 'Array',
          name: 'Legal links',
          localized: false,
          items: {
            type: 'Link',
            linkType: 'Entry',
            validations: [{ linkContentType: ['link'] }],
          },
        },
      },
      {
        id: 'copyright',
        spec: { type: 'Symbol', name: 'Copyright text', localized: true },
      },
    ],
  },
]

export const FOOTER_EXTENDED_FIELD_DEFINITIONS: {
  id: string
  spec: FieldSpec
}[] = [
  {
    id: 'newsletterTitle',
    spec: { type: 'Symbol', name: 'Newsletter title', localized: true },
  },
  {
    id: 'newsletterDescription',
    spec: { type: 'Symbol', name: 'Newsletter description', localized: true },
  },
  {
    id: 'newsletterVoucherText',
    spec: { type: 'Symbol', name: 'Newsletter voucher text', localized: true },
  },
  {
    id: 'newsletterDescriptionEnd',
    spec: {
      type: 'Symbol',
      name: 'Newsletter description end',
      localized: true,
    },
  },
  {
    id: 'newsletterSignUpLabel',
    spec: { type: 'Symbol', name: 'Newsletter sign up label', localized: true },
  },
  {
    id: 'customerServiceTitle',
    spec: { type: 'Symbol', name: 'Customer service title', localized: true },
  },
  {
    id: 'customerServicePhone',
    spec: { type: 'Symbol', name: 'Customer service phone', localized: true },
  },
  {
    id: 'customerServiceHours',
    spec: { type: 'Symbol', name: 'Customer service hours', localized: true },
  },
  {
    id: 'customerServiceContactUs',
    spec: {
      type: 'Link',
      name: 'Customer service contact',
      linkType: 'Entry',
      validations: [{ linkContentType: ['link'] }],
    },
  },
  {
    id: 'paymentMethodsTitle',
    spec: { type: 'Symbol', name: 'Payment methods title', localized: true },
  },
  {
    id: 'paymentMethodsList',
    spec: {
      type: 'Text',
      name: 'Payment methods (one per line)',
      localized: true,
    },
  },
  {
    id: 'languageTitle',
    spec: { type: 'Symbol', name: 'Language section title', localized: true },
  },
]

export function getLayoutContentTypeDefinition(id: string) {
  const found = LAYOUT_DEFINITIONS.find((d) => d.id === id)
  if (!found) {
    throw new Error(`Unknown sections content type: ${id}`)
  }
  return found
}

/** Footer content type with base + extended fields (one migration). */
export function getFooterContentTypeDefinition(): ContentTypeDefinition {
  const base = LAYOUT_DEFINITIONS.find((d) => d.id === 'footer')
  if (!base) {
    throw new Error('Footer definition not found')
  }
  const extended = FOOTER_EXTENDED_FIELD_DEFINITIONS
  return {
    ...base,
    fields: [...base.fields, ...extended.map(({ id, spec }) => ({ id, spec }))],
  }
}
