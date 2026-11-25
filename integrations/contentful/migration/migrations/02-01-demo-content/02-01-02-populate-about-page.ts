/**
 * Populates the about page with typed components and images.
 * CTA and image links use placeholders (#); real About/Support links for nav are created in the footer migration.
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
import { RICH_TEXT_ABOUT } from './shared/rich-text'

// ——— Migrated content ———

const ABOUT_PAGE = {
  'en-US': {
    slug: 'about',
    pageTitle: 'About us',
    pageTitleVisibility: 'visible',
    metaTitle: 'About us – Shopin Store',
    metaDescription:
      'Our story, values, and the people behind the brand. Sustainability and fair practices at heart.',
    noIndex: false,
  },
  'de-DE': {
    slug: 'ueber-uns',
    pageTitle: 'Über uns',
    pageTitleVisibility: 'visible',
    metaTitle: 'Über uns – Shopin Store',
    metaDescription:
      'Unsere Geschichte, Werte und die Menschen hinter der Marke.',
    noIndex: false,
  },
}

const ABOUT_IMAGE = {
  teaser: {
    url: 'https://picsum.photos/seed/about1/1200/800',
    fileName: 'about-teaser.jpg',
  },
  og: {
    title: 'About us OG',
    url: 'https://picsum.photos/seed/about-og/1200/630',
    fileName: 'about-og.jpg',
  },
}

const TEASER_TEXT = {
  'en-US': {
    body: 'Founded in 2020, we work with designers and makers around the world. Sustainability and fair practices are at the heart of what we do.',
  },
  'de-DE': {
    body: 'Gegründet 2020 – wir arbeiten mit Designern und Machern weltweit. Nachhaltigkeit und faire Bedingungen stehen bei uns im Mittelpunkt.',
  },
}

const TEASER_RICH_TEXT = {
  'en-US': { title: 'Our values', richText: RICH_TEXT_ABOUT['en-US'] },
  'de-DE': { title: 'Unsere Werte', richText: RICH_TEXT_ABOUT['de-DE'] },
}

// ——— Migration ———

async function run(migration: unknown) {
  const client = getManagementClient(migration)
  const { page } = await getOrCreatePage(client, 'about', ABOUT_PAGE)
  if (getLocalizedArrayLength(page, 'components', DEFAULT_LOCALE) > 0) {
    throw new Error('About page already has components')
  }

  // Placeholder links for CTA and image (no linkedPage; footer creates real About/Support links for nav).
  const linkContactId = await createEntryWithLocales(client, 'link', {
    'en-US': { label: 'Contact', url: '#' },
    'de-DE': { label: 'Kontakt', url: '#' },
  })
  const linkAboutPlaceholderId = await createEntryWithLocales(client, 'link', {
    'en-US': { label: 'About us', url: '#' },
    'de-DE': { label: 'Über uns', url: '#' },
  })

  const buttonContactId = await createEntryWithLocales(client, 'button', {
    'en-US': { name: 'Contact', link: toEntryRef(linkContactId) },
    'de-DE': { name: 'Kontakt', link: toEntryRef(linkContactId) },
  })
  const TEASER_HEADLINE = {
    'en-US': {
      headline: 'Our story',
      subtext: 'We started with a simple idea: bring great design to everyone.',
      cta: toEntryRef(buttonContactId),
    },
    'de-DE': {
      headline: 'Unsere Geschichte',
      subtext: 'Wir starteten mit einer einfachen Idee: gutes Design für alle.',
      cta: toEntryRef(buttonContactId),
    },
  }
  const TEASER_IMAGE = {
    'en-US': {
      title: 'Our team',
      caption: 'Meet the people behind the brand.',
      link: toEntryRef(linkAboutPlaceholderId),
    },
    'de-DE': {
      title: 'Unser Team',
      caption: 'Die Menschen hinter der Marke.',
      link: toEntryRef(linkAboutPlaceholderId),
    },
  }

  let updated = await populatePageWithComponents(client, page, [
    { contentTypeId: 'teaserHeadline', fields: TEASER_HEADLINE },
    { contentTypeId: 'teaserImage', fields: TEASER_IMAGE },
    { contentTypeId: 'teaserText', fields: TEASER_TEXT },
    { contentTypeId: 'teaserRichText', fields: TEASER_RICH_TEXT },
  ])

  const afterParent = await ensureParentPage(client, updated, 'homepage')
  updated = afterParent ?? updated
  await attachTeaserAndOgImages(client, updated, ABOUT_IMAGE)
}

export = run
