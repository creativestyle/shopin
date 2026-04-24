import type { ContentPageResponse } from '@core/contracts/content/page'
import type { RichTextDocumentResponse } from '@core/contracts/content/rich-text-document'
import type { ContentImage } from '@core/contracts/content/content-image'
import { defaultBasePage, placeholderImage } from './base'
import { whyShopWithUsRichText } from './rich-text-sample'

type Placeholder = (w: number, h: number, title?: string) => ContentImage

/** Minimal rich text document with one paragraph (for mock accordion body). */
function docParagraph(text: string): RichTextDocumentResponse {
  return {
    nodeType: 'document',
    data: {},
    content: [
      {
        nodeType: 'paragraph',
        data: {},
        content: [{ nodeType: 'text', value: text, data: {}, marks: [] }],
      },
    ],
  }
}

function getHomepageComponents(
  placeholder: Placeholder
): ContentPageResponse['components'] {
  return [
    {
      type: 'hero',
      backgroundImage: placeholder(400, 300),
      headline: 'Close to (your) nature',
      body: 'See our new collection made of recycled materials. Sustainable style for every day.',
      cta: { link: { label: 'Shop now', url: '/c' } },
    },
    {
      type: 'productCarousel',
      title: 'Featured products',
      categorySlug: 'furniture',
    },
    {
      type: 'headline',
      headline: 'New collection is here',
      subtext:
        'Explore our latest arrivals and find your next favourite piece.',
      cta: { link: { label: 'View collection', url: '/new' } },
    },
    {
      type: 'banner',
      backgroundImage: placeholder(1200, 400),
      headline: 'Welcome to the Teaser Showcase',
      body: 'This homepage demonstrates all teaser types: hero, banner, headline, image, carousel, slider, text, rich text, product carousel, section, regular, accordion.',
      cta: { link: { label: 'Explore', url: '/new' } },
    },
    {
      type: 'regular',
      image: placeholder(800, 600),
      categoryLabel: 'DAMEN',
      headline: 'Entdecke tolle Sonderangebote!',
      body: 'Passion, to inspire customers for our products. This passion accompanies us in every endeavor and all decisions of our daily actions.',
      cta: { link: { label: 'Learn more', url: '/sale' } },
    },
    {
      type: 'slider',
      title: 'Hero slider',
      items: [
        {
          image: placeholder(1200, 400),
          headline: 'New season',
          body: 'Discover the latest styles and trends for the season ahead.',
          cta: { link: { label: 'Shop new arrivals', url: '/new' } },
        },
        {
          image: placeholder(1200, 400),
          headline: 'Best sellers',
          body: 'Our most loved pieces, chosen by you.',
          cta: { link: { label: 'View collection', url: '/new' } },
        },
        {
          image: placeholder(1200, 400),
          headline: 'Sale',
          body: "Limited time offers on selected items. Don't miss out.",
          cta: { link: { label: 'Shop sale', url: '/sale' } },
        },
      ],
    },
    {
      type: 'section',
      categoryLabel: 'DAMEN',
      headline: 'Jeans & Hosen',
      body: 'Premium fabrics, stylish looks, and tailor-made fits - Discover our incredible line of pants and jeans.',
      subcategoryLinks: [
        { label: 'See subcategory', url: '/women/jeans' },
        { label: 'See subcategory', url: '/women/trousers' },
        { label: 'See subcategory', url: '/women/shorts' },
        { label: 'See subcategory', url: '/women/leggings' },
        { label: 'See subcategory', url: '/women/jumpsuits' },
      ],
      image: placeholder(800, 600),
    },
    {
      type: 'image',
      title: 'New in',
      image: {
        url: 'https://d187yychpee5t0.cloudfront.net/wysiwyg/teasers_2023/hero_1_1.png',
        alt: 'New in',
        title: 'New in',
      },
      caption: 'Discover the latest trends.',
      link: { label: 'New in', url: '/new' },
    },
    {
      type: 'carousel',
      title: 'Featured',
      items: [
        {
          image: placeholder(280, 210, 'Summer essentials'),
          caption: 'Summer essentials',
          link: { label: 'Summer essentials', url: '/new' },
        },
        {
          image: placeholder(280, 210, 'Best sellers'),
          caption: 'Best sellers',
          link: { label: 'Best sellers', url: '/new' },
        },
        {
          image: placeholder(280, 210, 'Gift ideas'),
          caption: 'Gift ideas',
          link: { label: 'Gift ideas', url: '/new' },
        },
        {
          image: placeholder(280, 210, 'New arrivals'),
          caption: 'New arrivals',
          link: { label: 'New arrivals', url: '/c' },
        },
        {
          image: placeholder(280, 210, 'Sale'),
          caption: 'Sale',
          link: { label: 'Sale', url: '/sale' },
        },
        {
          image: placeholder(280, 210, 'Trending now'),
          caption: 'Trending now',
          link: { label: 'Trending now', url: '/c' },
        },
        {
          image: placeholder(280, 210, 'Staff picks'),
          caption: 'Staff picks',
          link: { label: 'Staff picks', url: '/c' },
        },
        {
          image: placeholder(280, 210, 'Limited edition'),
          caption: 'Limited edition',
          link: { label: 'Limited edition', url: '/new' },
        },
        {
          image: placeholder(280, 210, 'Back in stock'),
          caption: 'Back in stock',
          link: { label: 'Back in stock', url: '/c' },
        },
        {
          image: placeholder(280, 210, 'Winter collection'),
          caption: 'Winter collection',
          link: { label: 'Winter collection', url: '/c' },
        },
      ],
    },
    {
      type: 'text',
      body: 'We believe in quality, sustainability, and style. Every piece in our store is chosen with care. Free returns and secure payment – shop with confidence.',
    },
    {
      type: 'richText',
      title: 'Why shop with us',
      richText: whyShopWithUsRichText,
    },
    {
      type: 'headline',
      headline: 'Featured item',
      subtext: 'Discover our curated selection.',
      cta: { link: { label: 'Shop now', url: '/c' } },
    },
    {
      type: 'accordion',
      title: 'FAQ',
      mode: 'single',
      items: [
        {
          title: 'Shipping',
          expanded: false,
          body: docParagraph('We ship within 2–5 business days.'),
        },
        {
          title: 'Returns',
          expanded: false,
          body: docParagraph('30-day free returns and exchanges.'),
        },
        {
          title: 'Contact',
          expanded: false,
          body: docParagraph('Reach us at support@example.com.'),
        },
      ],
    },
  ]
}

export function getHomepage(
  placeholder: Placeholder = placeholderImage
): ContentPageResponse {
  return {
    ...defaultBasePage,
    slug: 'homepage',
    pageTitle: 'Home',
    pageTitleVisibility: 'srOnly',
    components: getHomepageComponents(placeholder),
  }
}
