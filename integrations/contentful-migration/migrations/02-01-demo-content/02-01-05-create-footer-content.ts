/**
 * Creates all footer content: link entries, footer sections, and the footer entry.
 * Run after 02-01-01 … 02-01-04 so About and Support pages exist; footer links to them via linkedPage.
 * Fails if footer content already exists.
 */
import type { PlainClientAPI } from 'contentful-management'
import { getManagementClient } from '../lib/client'
import { createEntryWithLocales, createLinkEntries } from '../lib/entries'
import { toEntryRef } from '../lib/links'
import {
  getOrCreateLinkForPage,
  ensureNoEntryOfType,
} from '../lib/page-teasers'

// ——— Migrated content ———

type LinkByLocale = Record<string, Record<string, unknown>>

const LEGAL_LINKS: LinkByLocale[] = [
  {
    'en-US': { label: 'Imprint', url: '/impressum' },
    'de-DE': { label: 'Impressum', url: '/impressum' },
  },
  {
    'en-US': { label: 'Terms', url: '/agb' },
    'de-DE': { label: 'AGB', url: '/agb' },
  },
  {
    'en-US': { label: 'Privacy', url: '/datenschutz' },
    'de-DE': { label: 'Datenschutz', url: '/datenschutz' },
  },
  {
    'en-US': { label: 'Privacy settings', url: '/privacy-settings' },
    'de-DE': { label: 'Datenschutzeinstellungen', url: '/privacy-settings' },
  },
]

const COMPANY_LINK_WEBSITE: LinkByLocale = {
  'en-US': {
    label: 'Website',
    url: '#',
    target: '_blank',
    rel: 'noopener noreferrer',
  },
  'de-DE': {
    label: 'Website',
    url: '#',
    target: '_blank',
    rel: 'noopener noreferrer',
  },
}
const COMPANY_LINK_CAREER: LinkByLocale = {
  'en-US': {
    label: 'Career',
    url: '#',
    target: '_blank',
    rel: 'noopener noreferrer',
  },
  'de-DE': {
    label: 'Karriere',
    url: '#',
    target: '_blank',
    rel: 'noopener noreferrer',
  },
}
const COMPANY_LINK_ABOUT: LinkByLocale = {
  'en-US': { label: 'About us', url: '/about' },
  'de-DE': { label: 'Über uns', url: '/about' },
}
const COMPANY_LINK_SUPPORT: LinkByLocale = {
  'en-US': { label: 'Support', url: '/support' },
  'de-DE': { label: 'Support', url: '/support' },
}

const SERVICE_LINKS: LinkByLocale[] = [
  {
    'en-US': {
      label: 'Store finder',
      url: '#',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    'de-DE': {
      label: 'Storefinder',
      url: '#',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  },
  {
    'en-US': { label: 'Returns', url: '/returns' },
    'de-DE': { label: 'Retournieren', url: '/returns' },
  },
  {
    'en-US': { label: 'Help & FAQ', url: '/help' },
    'de-DE': { label: 'Hilfe & FAQ', url: '/help' },
  },
]

const SOCIAL_LINKS: LinkByLocale[] = [
  {
    'en-US': {
      label: 'Facebook',
      url: '#',
      target: '_blank',
      rel: 'noopener noreferrer',
      noFollow: true,
    },
    'de-DE': {
      label: 'Facebook',
      url: '#',
      target: '_blank',
      rel: 'noopener noreferrer',
      noFollow: true,
    },
  },
  {
    'en-US': {
      label: 'Instagram',
      url: '#',
      target: '_blank',
      rel: 'noopener noreferrer',
      noFollow: true,
    },
    'de-DE': {
      label: 'Instagram',
      url: '#',
      target: '_blank',
      rel: 'noopener noreferrer',
      noFollow: true,
    },
  },
  {
    'en-US': {
      label: 'YouTube',
      url: '#',
      target: '_blank',
      rel: 'noopener noreferrer',
      noFollow: true,
    },
    'de-DE': {
      label: 'YouTube',
      url: '#',
      target: '_blank',
      rel: 'noopener noreferrer',
      noFollow: true,
    },
  },
]

/** Gift voucher in contract shape (title + link). Contentful stores flat fields. */
const GIFT_VOUCHER = {
  'en-US': {
    title: 'Gift voucher',
    link: { label: 'Buy gift voucher', url: '#' },
  },
  'de-DE': {
    title: 'Geschenkgutschein',
    link: { label: 'Gutschein kaufen', url: '#' },
  },
} as const

const FOOTER_SECTIONS = {
  company: { 'en-US': { title: 'Company' }, 'de-DE': { title: 'Unternehmen' } },
  service: {
    'en-US': { title: 'Service & Help' },
    'de-DE': { title: 'Service & Hilfe' },
  },
}

const FOOTER_FIELDS = {
  'en-US': {
    copyright: '© 2026 Shopin. All rights reserved.',
    newsletterTitle: 'Subscribe to our newsletter',
    newsletterDescription: 'Get the latest news and',
    newsletterVoucherText: '10% discount',
    newsletterDescriptionEnd: 'for new subscribers.',
    newsletterSignUpLabel: 'Sign up',
    customerServiceTitle: 'Customer service',
    customerServicePhone: '+49 123 456789',
    customerServiceHours: 'Mon–Fri 9:00–18:00',
    customerServiceContactUsLabel: 'Contact us',
    socialTitle: 'Follow us',
    giftVoucherTitle: GIFT_VOUCHER['en-US'].title,
    giftVoucherLinkLabel: GIFT_VOUCHER['en-US'].link.label,
    giftVoucherLinkUrl: GIFT_VOUCHER['en-US'].link.url,
    paymentMethodsTitle: 'Payment methods',
    paymentMethodsList:
      'Invoice\nPrepayment\nApple Pay\nPayPal\nAmazon Pay\nVisa\nMastercard\nAmex',
    shippingTitle: 'Shipping',
    shippingItemsList: 'DHL|GoGreen\nDHL Express',
    languageTitle: 'Language',
  },
  'de-DE': {
    copyright: '© 2026 Shopin. Alle Rechte vorbehalten.',
    newsletterTitle: 'Newsletter abonnieren',
    newsletterDescription: 'Aktuelle Neuigkeiten und',
    newsletterVoucherText: '10 % Rabatt',
    newsletterDescriptionEnd: 'für neue Abonnenten.',
    newsletterSignUpLabel: 'Anmelden',
    customerServiceTitle: 'Kundenservice',
    customerServicePhone: '+49 123 456789',
    customerServiceHours: 'Mo–Fr 9:00–18:00',
    customerServiceContactUsLabel: 'Kontakt',
    socialTitle: 'Folgen Sie uns',
    giftVoucherTitle: GIFT_VOUCHER['de-DE'].title,
    giftVoucherLinkLabel: GIFT_VOUCHER['de-DE'].link.label,
    giftVoucherLinkUrl: GIFT_VOUCHER['de-DE'].link.url,
    paymentMethodsTitle: 'Zahlungsmethoden',
    paymentMethodsList:
      'Rechnung\nVorkasse\nApple Pay\nPayPal\nAmazon Pay\nVisa\nMastercard\nAmex',
    shippingTitle: 'Versand',
    shippingItemsList: 'DHL|GoGreen\nDHL Express',
    languageTitle: 'Sprache',
  },
}

// ——— Migration ———

/** Company section: Website, Career, About us, Support. All page links use getOrCreateLinkForPage. */
async function createCompanyLinkIds(client: PlainClientAPI): Promise<string[]> {
  const websiteId = await createEntryWithLocales(
    client,
    'link',
    COMPANY_LINK_WEBSITE
  )
  const careerId = await createEntryWithLocales(
    client,
    'link',
    COMPANY_LINK_CAREER
  )
  const aboutId = await getOrCreateLinkForPage(
    client,
    COMPANY_LINK_ABOUT,
    'about'
  )
  const supportId = await getOrCreateLinkForPage(
    client,
    COMPANY_LINK_SUPPORT,
    'support'
  )
  return [websiteId, careerId, aboutId, supportId]
}

async function createFooterSection(
  client: PlainClientAPI,
  section: { 'en-US': { title: string }; 'de-DE': { title: string } },
  linkIds: string[]
): Promise<string> {
  const refs = linkIds.map(toEntryRef)
  return createEntryWithLocales(client, 'footerSection', {
    'en-US': { ...section['en-US'], links: refs },
    'de-DE': { ...section['de-DE'], links: refs },
  })
}

async function createFooterEntry(
  client: PlainClientAPI,
  payload: {
    companyLinkIds: string[]
    legalLinkIds: string[]
    serviceLinkIds: string[]
    socialLinkIds: string[]
  }
): Promise<void> {
  const section1Id = await createFooterSection(
    client,
    FOOTER_SECTIONS.company,
    payload.companyLinkIds
  )
  const section2Id = await createFooterSection(
    client,
    FOOTER_SECTIONS.service,
    payload.serviceLinkIds
  )
  const footerLinksRefs = [section1Id, section2Id].map(toEntryRef)
  const legalRefs = payload.legalLinkIds.map(toEntryRef)
  const socialRefs = payload.socialLinkIds.map(toEntryRef)

  await createEntryWithLocales(client, 'footer', {
    'en-US': {
      ...FOOTER_FIELDS['en-US'],
      footerLinks: footerLinksRefs,
      legalLinks: legalRefs,
      socialLinks: socialRefs,
    },
    'de-DE': {
      ...FOOTER_FIELDS['de-DE'],
      footerLinks: footerLinksRefs,
      legalLinks: legalRefs,
      socialLinks: socialRefs,
    },
  })
}

async function run(migration: unknown) {
  const client = getManagementClient(migration)
  await ensureNoEntryOfType(client, 'footer', 'Footer content already exists')
  const legalLinkIds = await createLinkEntries(client, LEGAL_LINKS)
  const companyLinkIds = await createCompanyLinkIds(client)
  const serviceLinkIds = await createLinkEntries(client, SERVICE_LINKS)
  const socialLinkIds = await createLinkEntries(client, SOCIAL_LINKS)

  await createFooterEntry(client, {
    companyLinkIds,
    legalLinkIds,
    serviceLinkIds,
    socialLinkIds,
  })
}

export = run
