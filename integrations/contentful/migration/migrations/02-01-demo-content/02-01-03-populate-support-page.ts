/**
 * Populates the support page with typed components and images.
 * CTA and image link use a placeholder (#); real Support link for nav is created in the footer migration.
 */
import { getManagementClient } from '../lib/client'
import { DEFAULT_LOCALE } from '../lib/constants'
import { toEntryRef } from '../lib/links'
import { createEntryWithLocales } from '../lib/entries'
import {
  getOrCreatePage,
  populatePageWithComponents,
  ensureParentPage,
  attachTeaserAndOgImages,
} from '../lib/page-teasers'
import { getLocalizedArrayLength } from '../lib/links'

// ——— Migrated content ———

const SUPPORT_PAGE = {
  'en-US': {
    slug: 'support',
    pageTitle: 'Support',
    pageTitleVisibility: 'visible',
    metaTitle: 'Support – Shopin Store',
    metaDescription:
      "Shipping, returns, FAQ. Contact us or track your order. We're here to help.",
    noIndex: false,
  },
  'de-DE': {
    slug: 'support',
    pageTitle: 'Support',
    pageTitleVisibility: 'visible',
    metaTitle: 'Support – Shopin Store',
    metaDescription: 'Versand, Rückgabe, FAQ. Kontakt und Bestellverfolgung.',
    noIndex: false,
  },
}

const SUPPORT_IMAGE = {
  teaser: {
    url: 'https://picsum.photos/seed/support1/800/600',
    fileName: 'support-teaser.jpg',
  },
  og: {
    title: 'Support OG',
    url: 'https://picsum.photos/seed/support-og/1200/630',
    fileName: 'support-og.jpg',
  },
}

const TEASER_TEXT = {
  'en-US': {
    body: "Shipping: 2–5 business days. Returns: 30 days, free and easy. Need a different size? We'll exchange it at no extra cost.",
  },
  'de-DE': {
    body: 'Versand: 2–5 Werktage. Rückgabe: 30 Tage, kostenlos und unkompliziert. Andere Größe? Umtausch ohne Aufpreis.',
  },
}

// ——— Migration ———

async function run(migration: unknown) {
  const client = getManagementClient(migration)
  const { page } = await getOrCreatePage(client, 'support', SUPPORT_PAGE)
  if (getLocalizedArrayLength(page, 'components', DEFAULT_LOCALE) > 0) {
    throw new Error('Support page already has components')
  }

  // Placeholder link for CTA and image (no linkedPage; footer creates real Support link for nav).
  const linkContactId = await createEntryWithLocales(client, 'link', {
    'en-US': { label: 'Contact', url: '#' },
    'de-DE': { label: 'Kontakt', url: '#' },
  })

  const buttonContactId = await createEntryWithLocales(client, 'button', {
    'en-US': { name: 'Contact', link: toEntryRef(linkContactId) },
    'de-DE': { name: 'Kontakt', link: toEntryRef(linkContactId) },
  })
  const TEASER_HEADLINE = {
    'en-US': {
      headline: 'How can we help?',
      subtext: 'Find answers, contact us, or track your order.',
      cta: toEntryRef(buttonContactId),
    },
    'de-DE': {
      headline: 'Wie können wir helfen?',
      subtext: 'Antworten finden, Kontakt aufnehmen oder Bestellung verfolgen.',
      cta: toEntryRef(buttonContactId),
    },
  }
  const TEASER_IMAGE = {
    'en-US': {
      title: 'FAQ',
      caption: 'Common questions and answers.',
      link: toEntryRef(linkContactId),
    },
    'de-DE': {
      title: 'FAQ',
      caption: 'Häufige Fragen und Antworten.',
      link: toEntryRef(linkContactId),
    },
  }

  let updated = await populatePageWithComponents(client, page, [
    { contentTypeId: 'teaserHeadline', fields: TEASER_HEADLINE },
    { contentTypeId: 'teaserText', fields: TEASER_TEXT },
    { contentTypeId: 'teaserImage', fields: TEASER_IMAGE },
  ])

  const afterParent = await ensureParentPage(client, updated, 'homepage')
  updated = afterParent ?? updated
  await attachTeaserAndOgImages(client, updated, SUPPORT_IMAGE)
}

export = run
