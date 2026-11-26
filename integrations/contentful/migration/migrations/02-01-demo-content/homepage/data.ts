/**
 * Homepage migration: all content data (page, images, links, teaser copy).
 */
import type { EntryLinkRef } from '../../lib/links'
import { richTextFromParagraph, getRichTextHomepage } from '../shared/rich-text'

export const HOMEPAGE_PAGE = {
  'en-US': {
    slug: 'homepage',
    pageTitle: 'Homepage',
    pageTitleVisibility: 'srOnly' as const,
    metaTitle: 'Shopin Store – Home',
    metaDescription:
      'Shop the best selection. Free returns, secure payment, sustainable choices.',
    noIndex: false,
  },
  'de-DE': {
    slug: 'startseite',
    pageTitle: 'Startseite',
    pageTitleVisibility: 'srOnly' as const,
    metaTitle: 'Shopin Store – Startseite',
    metaDescription:
      'Das beste Sortiment. Kostenlose Retoure, sichere Zahlung, nachhaltige Wahl.',
    noIndex: false,
  },
}

export const HOMEPAGE_IMAGES = [
  'https://picsum.photos/seed/newin1/1200/800',
  'https://picsum.photos/seed/hero1/1920/1080',
  'https://d187yychpee5t0.cloudfront.net/wysiwyg/teasers_2023/hero_1_1.png',
  'https://picsum.photos/seed/about1/1200/800',
  'https://picsum.photos/seed/carousel1/800/600',
  'https://picsum.photos/seed/carousel2/800/600',
  'https://picsum.photos/seed/carousel3/800/600',
  'https://picsum.photos/seed/slider1/1920/720',
  'https://picsum.photos/seed/slider2/1920/720',
  'https://picsum.photos/seed/slider3/1920/720',
  'https://picsum.photos/seed/product1/800/800',
  'https://picsum.photos/seed/section1/800/600',
  'https://picsum.photos/seed/regular1/800/600',
]

export const LINK_SHOP = {
  'en-US': { label: 'Shop', url: '/c' },
  'de-DE': { label: 'Shop', url: '/c' },
}
export const LINK_NEW_ARRIVALS = {
  'en-US': { label: 'New arrivals', url: '/new' },
  'de-DE': { label: 'Neuheiten', url: '/new' },
}
export const LINK_SALE = {
  'en-US': { label: 'Sale', url: '/sale' },
  'de-DE': { label: 'Sale', url: '/sale' },
}
export const SECTION_LINKS = [
  {
    'en-US': {
      label: 'See subcategory',
      url: '/women/jeans',
      ariaLabel: 'See subcategory Women Jeans',
    },
    'de-DE': {
      label: 'Unterkategorie ansehen',
      url: '/women/jeans',
      ariaLabel: 'Unterkategorie Women Jeans ansehen',
    },
  },
  {
    'en-US': {
      label: 'See subcategory',
      url: '/women/trousers',
      ariaLabel: 'See subcategory Women Trousers',
    },
    'de-DE': {
      label: 'Unterkategorie ansehen',
      url: '/women/trousers',
      ariaLabel: 'Unterkategorie Women Trousers ansehen',
    },
  },
  {
    'en-US': {
      label: 'See subcategory',
      url: '/women/shorts',
      ariaLabel: 'See subcategory Women Shorts',
    },
    'de-DE': {
      label: 'Unterkategorie ansehen',
      url: '/women/shorts',
      ariaLabel: 'Unterkategorie Women Shorts ansehen',
    },
  },
  {
    'en-US': {
      label: 'See subcategory',
      url: '/women/leggings',
      ariaLabel: 'See subcategory Women Leggings',
    },
    'de-DE': {
      label: 'Unterkategorie ansehen',
      url: '/women/leggings',
      ariaLabel: 'Unterkategorie Women Leggings ansehen',
    },
  },
  {
    'en-US': {
      label: 'See subcategory',
      url: '/women/jumpsuits',
      ariaLabel: 'See subcategory Women Jumpsuits',
    },
    'de-DE': {
      label: 'Unterkategorie ansehen',
      url: '/women/jumpsuits',
      ariaLabel: 'Unterkategorie Women Jumpsuits ansehen',
    },
  },
]

/** Rich text teaser with all node types and marks; pass assetId to include embedded image. */
export function getRichTeaser(options?: { assetId?: string }) {
  const docs = getRichTextHomepage(options)
  return {
    'en-US': { title: 'Why shop with us', richText: docs['en-US'] },
    'de-DE': {
      title: 'Warum bei uns kaufen',
      richText: docs['de-DE'],
    },
  }
}
export const PRODUCT_CAROUSEL = {
  'en-US': { title: 'Featured products', categorySlug: 'furniture' },
  'de-DE': { title: 'Empfohlene Produkte', categorySlug: 'furniture' },
}
export const HEADLINE = (ctaRef: EntryLinkRef) => ({
  'en-US': {
    headline: 'New collection is here',
    subtext: 'Explore our latest arrivals and find your next favourite piece.',
    cta: ctaRef,
  },
  'de-DE': {
    headline: 'Neue Kollektion ist da',
    subtext:
      'Entdecke unsere neuesten Arrivals und finde dein nächstes Lieblingsstück.',
    cta: ctaRef,
  },
})
export const BANNER = (ctaRef: EntryLinkRef) => ({
  'en-US': {
    headline: 'Welcome to the Teaser Showcase',
    body: 'This homepage demonstrates all teaser types: hero, banner, headline, image, carousel, text, rich text, and product carousel.',
    cta: ctaRef,
  },
  'de-DE': {
    headline: 'Willkommen in der Teaser-Showcase',
    body: 'Diese Startseite zeigt alle Teaser-Typen: Hero, Banner, Headline, Bild, Karussell, Text, Rich-Text und Produkt-Karussell.',
    cta: ctaRef,
  },
})
export const REGULAR = (ctaRef: EntryLinkRef) => ({
  'en-US': {
    categoryLabel: 'WOMEN',
    headline: 'Discover great special offers!',
    body: 'Passion, to inspire customers for our products. This passion accompanies us in every endeavor and all decisions of our daily actions.',
    cta: ctaRef,
  },
  'de-DE': {
    categoryLabel: 'DAMEN',
    headline: 'Entdecke tolle Sonderangebote!',
    body: 'Leidenschaft, um Kunden für unsere Produkte zu begeistern. Diese Leidenschaft begleitet uns bei allem, was wir tun.',
    cta: ctaRef,
  },
})
export const SLIDER_SLIDES = (
  ctaRef1: EntryLinkRef,
  ctaRef2: EntryLinkRef,
  ctaRef3: EntryLinkRef
) => [
  {
    'en-US': {
      caption: 'Slide 1 – New season',
      headline: 'New season',
      body: 'Discover the latest styles and trends for the season ahead.',
      cta: ctaRef1,
    },
    'de-DE': {
      caption: 'Slide 1 – Neue Saison',
      headline: 'Neue Saison',
      body: 'Die neuesten Styles und Trends.',
      cta: ctaRef1,
    },
  },
  {
    'en-US': {
      caption: 'Slide 2 – Best sellers',
      headline: 'Best sellers',
      body: 'Our most loved pieces, chosen by you.',
      cta: ctaRef2,
    },
    'de-DE': {
      caption: 'Slide 2 – Bestseller',
      headline: 'Bestseller',
      body: 'Unsere beliebtesten Stücke.',
      cta: ctaRef2,
    },
  },
  {
    'en-US': {
      caption: 'Slide 3 – Sale',
      headline: 'Sale',
      body: "Limited time offers on selected items. Don't miss out.",
      cta: ctaRef3,
    },
    'de-DE': {
      caption: 'Slide 3 – Sale',
      headline: 'Sale',
      body: 'Zeitlich begrenzte Angebote.',
      cta: ctaRef3,
    },
  },
]
export const SLIDER_TITLE = {
  'en-US': { title: 'Hero slider' },
  'de-DE': { title: 'Hero-Slider' },
}
export const SECTION = (subcategoryRefs: EntryLinkRef[]) => ({
  'en-US': {
    categoryLabel: 'WOMEN',
    headline: 'Jeans & Trousers',
    body: 'Premium fabrics, stylish looks, and tailor-made fits - Discover our incredible line of pants and jeans.',
    subcategoryLinkEntries: subcategoryRefs,
  },
  'de-DE': {
    categoryLabel: 'DAMEN',
    headline: 'Jeans & Hosen',
    body: 'Premium-Stoffe, stylische Looks und maßgeschneiderte Passform.',
    subcategoryLinkEntries: subcategoryRefs,
  },
})
export const IMAGE_TEASER = (linkRef: EntryLinkRef) => ({
  'en-US': {
    title: 'New in',
    caption: 'Discover the latest trends.',
    link: linkRef,
  },
  'de-DE': {
    title: 'Neu eingetroffen',
    caption: 'Entdecke die neuesten Trends.',
    link: linkRef,
  },
})
export const VIDEO_TEASER = (linkRef: EntryLinkRef) => ({
  'en-US': {
    title: 'New in',
    caption: 'Discover the latest trends.',
    link: linkRef,
    autoplay: true,
    controls: false,
  },
  'de-DE': {
    title: 'Neu eingetroffen',
    caption: 'Entdecke die neuesten Trends.',
    link: linkRef,
  },
})

export const VIDEO_URLS = ['https://media.w3.org/2010/05/sintel/trailer_hd.mp4']
export const CAROUSEL_ITEMS = (
  linkNew: EntryLinkRef,
  linkC: EntryLinkRef,
  linkSale: EntryLinkRef
) => [
  {
    'en-US': { caption: 'Summer essentials', link: linkNew },
    'de-DE': { caption: 'Sommer-Basics', link: linkNew },
  },
  {
    'en-US': { caption: 'Best sellers', link: linkNew },
    'de-DE': { caption: 'Bestseller', link: linkNew },
  },
  {
    'en-US': { caption: 'Gift ideas', link: linkNew },
    'de-DE': { caption: 'Geschenkideen', link: linkNew },
  },
  {
    'en-US': { caption: 'New arrivals', link: linkC },
    'de-DE': { caption: 'Neuheiten', link: linkC },
  },
  {
    'en-US': { caption: 'Sale', link: linkSale },
    'de-DE': { caption: 'Sale', link: linkSale },
  },
  {
    'en-US': { caption: 'Trending now', link: linkC },
    'de-DE': { caption: 'Im Trend', link: linkC },
  },
  {
    'en-US': { caption: 'Staff picks', link: linkC },
    'de-DE': { caption: 'Team-Favoriten', link: linkC },
  },
  {
    'en-US': { caption: 'Limited edition', link: linkNew },
    'de-DE': { caption: 'Limitierte Edition', link: linkNew },
  },
  {
    'en-US': { caption: 'Back in stock', link: linkC },
    'de-DE': { caption: 'Wieder da', link: linkC },
  },
  {
    'en-US': { caption: 'Winter collection', link: linkC },
    'de-DE': { caption: 'Winter-Kollektion', link: linkC },
  },
]
export const CAROUSEL_TITLE = {
  'en-US': { title: 'Featured' },
  'de-DE': { title: 'Empfohlen' },
}
export const TEXT_TEASER = {
  'en-US': {
    body: 'We believe in quality, sustainability, and style. Every piece in our store is chosen with care. Free returns and secure payment – shop with confidence.',
  },
  'de-DE': {
    body: 'Wir setzen auf Qualität, Nachhaltigkeit und Stil. Jedes Stück wird mit Sorgfalt ausgewählt. Kostenlose Retoure und sichere Zahlung – kaufen Sie mit Vertrauen.',
  },
}
export const ACCORDION_ITEMS = [
  {
    'en-US': {
      title: 'Shipping',
      body: richTextFromParagraph('We ship within 2–5 business days.'),
    },
    'de-DE': {
      title: 'Versand',
      body: richTextFromParagraph('Wir liefern in 2–5 Werktagen.'),
    },
  },
  {
    'en-US': {
      title: 'Returns',
      body: richTextFromParagraph('30-day free returns and exchanges.'),
    },
    'de-DE': {
      title: 'Rückgabe',
      body: richTextFromParagraph('30 Tage kostenlose Rückgabe und Umtausch.'),
    },
  },
  {
    'en-US': {
      title: 'Contact',
      body: richTextFromParagraph('Reach us at support@example.com.'),
    },
    'de-DE': {
      title: 'Kontakt',
      body: richTextFromParagraph(
        'Erreichen Sie uns unter support@example.com.'
      ),
    },
  },
]
export const ACCORDION_TITLE = {
  'en-US': { title: 'FAQ' },
  'de-DE': { title: 'FAQ' },
}

export const BRAND = [
  {
    'en-US': { caption: 'Brand A' },
    'de-DE': { caption: 'Marke A' },
  },
  {
    'en-US': { caption: 'Brand B' },
    'de-DE': { caption: 'Marke B' },
  },
  {
    'en-US': { caption: 'Brand C' },
    'de-DE': { caption: 'Marke C' },
  },
  {
    'en-US': { caption: 'Brand D' },
    'de-DE': { caption: 'Marke D' },
  },
  {
    'en-US': { caption: 'Brand E' },
    'de-DE': { caption: 'Marke E' },
  },
  {
    'en-US': { caption: 'Brand F' },
    'de-DE': { caption: 'Marke F' },
  },
  {
    'en-US': { caption: 'Brand G' },
    'de-DE': { caption: 'Marke G' },
  },
  {
    'en-US': { caption: 'Brand H' },
    'de-DE': { caption: 'Marke H' },
  },
  {
    'en-US': { caption: 'Brand I' },
    'de-DE': { caption: 'Marke I' },
  },
  {
    'en-US': { caption: 'Brand J' },
    'de-DE': { caption: 'Marke J' },
  },
  {
    'en-US': { caption: 'Brand K' },
    'de-DE': { caption: 'Marke K' },
  },
  {
    'en-US': { caption: 'Brand L' },
    'de-DE': { caption: 'Marke L' },
  },
  {
    'en-US': { caption: 'Brand M' },
    'de-DE': { caption: 'Marke M' },
  },
]

export const BRAND_IMAGES = [
  'https://picsum.photos/seed/brand-a/800/600',
  'https://picsum.photos/seed/brand-b/800/600',
  'https://picsum.photos/seed/brand-c/800/600',
  'https://picsum.photos/seed/brand-d/800/600',
  'https://picsum.photos/seed/brand-e/800/600',
  'https://picsum.photos/seed/brand-f/800/600',
  'https://picsum.photos/seed/brand-g/800/600',
  'https://picsum.photos/seed/brand-h/800/600',
  'https://picsum.photos/seed/brand-i/800/600',
  'https://picsum.photos/seed/brand-j/800/600',
  'https://picsum.photos/seed/brand-k/800/600',
  'https://picsum.photos/seed/brand-l/800/600',
  'https://picsum.photos/seed/brand-m/800/600',
]

export const BRAND_TITLE = {
  'en-US': { title: 'Brands' },
  'de-DE': { title: 'Marken' },
}
