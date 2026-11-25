/**
 * Creates all footer content: link entries, footer sections, and the footer entry.
 * Run after 02-01-01 … 02-01-04 so About and Support pages exist; footer links to them via linkedPage.
 * Fails if footer content already exists.
 */
import type { PlainClientAPI } from 'contentful-management'
import { getManagementClient } from '../lib/client'
import { createEntryWithLocales } from '../lib/entries'
import { toEntryRef } from '../lib/links'
import {
  getOrCreateLinkForPage,
  ensureNoEntryOfType,
} from '../lib/page-teasers'

// ——— Migrated content ———

type LinkByLocale = Record<string, Record<string, unknown>>

/** Legal links are not seeded in Contentful; the storefront can merge defaults (e.g. demo package). */
const COMPANY_LINK_ABOUT: LinkByLocale = {
  'en-US': { label: 'About us', url: '/about' },
  'de-DE': { label: 'Über uns', url: '/about' },
}
const COMPANY_LINK_SUPPORT: LinkByLocale = {
  'en-US': { label: 'Support', url: '/support' },
  'de-DE': { label: 'Support', url: '/support' },
}

/** Customer-service CTA: external link entry referenced from footer. */
const CONTACT_ACCELERATOR_LINK: LinkByLocale = {
  'en-US': {
    label: 'Contact us',
    url: 'https://shopin.dev',
    target: '_blank',
  },
  'de-DE': {
    label: 'Kontakt',
    url: 'https://shopin.dev',
    target: '_blank',
  },
}

const FOOTER_SECTIONS = {
  company: { 'en-US': { title: 'Company' }, 'de-DE': { title: 'Unternehmen' } },
}

const COPYRIGHT = '© 2026 SHOPin frontend accelerator / creativestyle GmbH.'

const FOOTER_FIELDS = {
  'en-US': {
    copyright: COPYRIGHT,
    newsletterTitle: 'Subscribe to our newsletter',
    newsletterDescription: 'Get the latest news and',
    newsletterVoucherText: '10% discount',
    newsletterDescriptionEnd: 'for new subscribers.',
    newsletterSignUpLabel: 'Sign up',
    customerServiceTitle: 'Customer service',
    customerServicePhone:
      '+49 DEMO · SHOPin accelerator (please don’t call — it’s pretend)',
    customerServiceHours: 'Mon–Fri 9:00–18:00',
    paymentMethodsTitle: 'Payment methods',
    paymentMethodsList: 'Demo',
    languageTitle: 'Language',
  },
  'de-DE': {
    copyright: COPYRIGHT,
    newsletterTitle: 'Newsletter abonnieren',
    newsletterDescription: 'Aktuelle Neuigkeiten und',
    newsletterVoucherText: '10 % Rabatt',
    newsletterDescriptionEnd: 'für neue Abonnenten.',
    newsletterSignUpLabel: 'Anmelden',
    customerServiceTitle: 'Kundenservice',
    customerServicePhone:
      '+49 DEMO · SHOPin Accelerator (bitte nicht anrufen — nur Demo)',
    customerServiceHours: 'Mo–Fr 9:00–18:00',
    paymentMethodsTitle: 'Zahlungsmethoden',
    paymentMethodsList: 'Demo',
    languageTitle: 'Sprache',
  },
}

// ——— Migration ———

/** Company section: About us, Support. Both link to real CMS pages. */
async function createCompanyLinkIds(client: PlainClientAPI): Promise<string[]> {
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
  return [aboutId, supportId]
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
  }
): Promise<void> {
  const contactLinkId = await createEntryWithLocales(
    client,
    'link',
    CONTACT_ACCELERATOR_LINK
  )
  const contactRef = toEntryRef(contactLinkId)

  const section1Id = await createFooterSection(
    client,
    FOOTER_SECTIONS.company,
    payload.companyLinkIds
  )
  const footerLinksRefs = [section1Id].map(toEntryRef)

  await createEntryWithLocales(client, 'footer', {
    'en-US': {
      ...FOOTER_FIELDS['en-US'],
      footerLinks: footerLinksRefs,
      legalLinks: [],
      customerServiceContactUs: contactRef,
    },
    'de-DE': {
      ...FOOTER_FIELDS['de-DE'],
      footerLinks: footerLinksRefs,
      legalLinks: [],
      customerServiceContactUs: contactRef,
    },
  })
}

async function run(migration: unknown) {
  const client = getManagementClient(migration)
  await ensureNoEntryOfType(client, 'footer', 'Footer content already exists')
  const companyLinkIds = await createCompanyLinkIds(client)

  await createFooterEntry(client, {
    companyLinkIds,
  })
}

export = run
