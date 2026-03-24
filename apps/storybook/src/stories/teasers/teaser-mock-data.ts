/**
 * Shared mock data for all teaser stories.
 *
 * Shapes match @core/contracts/content (TeaserResponse and per-type schemas) and the
 * output of integrations/contentful-api mappers (mapTeaserEntryToResponse). Each mock
 * includes the `type` discriminator so it is a valid TeaserResponse for that teaser type.
 */

import type { RichTextDocumentResponse } from '@core/contracts/content/rich-text-document'
import type { HeroTeaser } from '@core/contracts/content/teaser-hero'
import type { BannerTeaser } from '@core/contracts/content/teaser-banner'
import type { HeadlineTeaser } from '@core/contracts/content/teaser-headline'
import type { ImageTeaser } from '@core/contracts/content/teaser-image'
import type { TextTeaser } from '@core/contracts/content/teaser-text'
import type { RichTextTeaser } from '@core/contracts/content/teaser-rich-text'
import type { CarouselTeaser } from '@core/contracts/content/teaser-carousel'
import type { SliderTeaser } from '@core/contracts/content/teaser-slider'
import type { ProductCarouselTeaser } from '@core/contracts/content/teaser-product-carousel'
import type { SectionTeaser } from '@core/contracts/content/teaser-section'
import type { RegularTeaser } from '@core/contracts/content/teaser-regular'
import type {
  AccordionTeaser,
  AccordionItem,
} from '@core/contracts/content/teaser-accordion'

export const MOCK_IMAGES = {
  banner: 'https://placehold.co/1200x400/1e3a5f/94a3b8?text=Hero',
  landscape: 'https://placehold.co/800x600/e2e8f0/64748b?text=Image',
  portrait: 'https://placehold.co/400x500/e2e8f0/64748b?text=Image',
  product: 'https://placehold.co/400x400/cbd5e1/475569?text=Product',
  slide: 'https://placehold.co/1200x675/cbd5e1/475569?text=Slide',
} as const

function img(
  url: string,
  width?: number,
  height?: number,
  title?: string
): {
  url: string
  alt: string
  width?: number
  height?: number
  title?: string
} {
  return {
    url,
    alt: title ?? '',
    ...(width != null && { width }),
    ...(height != null && { height }),
    ...(title != null && { title }),
  }
}

export const BANNER: BannerTeaser = {
  type: 'banner',
  backgroundImage: img(MOCK_IMAGES.banner, 1200, 400, 'Welcome hero'),
  headline: 'Welcome to the collection',
  body: 'Discover our latest arrivals and find your next favourite piece. Free shipping on orders over €50.',
  cta: { link: { label: 'Shop now', url: '/new' } },
}

export const HERO: HeroTeaser = {
  type: 'hero',
  backgroundImage: img(MOCK_IMAGES.banner, 1200, 400, 'Hero'),
  headline: 'Close to (your) nature',
  body: 'See our new collection made of recycled materials. Sustainable style for every day.',
  cta: { link: { label: 'Shop now', url: '/c' } },
}

export const HEADLINE: HeadlineTeaser = {
  type: 'headline',
  headline: 'New collection is here',
  subtext:
    'Explore our latest arrivals and find your next favourite piece. Curated for quality and style.',
  cta: { link: { label: 'View collection', url: '/new' } },
}

export const IMAGE: ImageTeaser = {
  type: 'image',
  title: 'New in',
  image: img(MOCK_IMAGES.portrait, 400, 500, 'New in'),
  caption: 'Discover the latest trends. Updated weekly.',
  link: { label: 'New in', url: '/new' },
}

export const TEXT: TextTeaser = {
  type: 'text',
  body: 'We believe in quality, sustainability, and style. Every piece in our store is chosen with care. Free returns and secure payment – shop with confidence.',
}

const RICH_TEXT_DOCUMENT: RichTextDocumentResponse = {
  nodeType: 'document',
  data: {},
  content: [
    {
      nodeType: 'paragraph',
      data: {},
      content: [
        { nodeType: 'text', value: 'Plain ', data: {}, marks: [] },
        {
          nodeType: 'text',
          value: 'bold',
          data: {},
          marks: [{ type: 'bold' }],
        },
        { nodeType: 'text', value: ', ', data: {}, marks: [] },
        {
          nodeType: 'text',
          value: 'italic',
          data: {},
          marks: [{ type: 'italic' }],
        },
        { nodeType: 'text', value: ', ', data: {}, marks: [] },
        {
          nodeType: 'text',
          value: 'underline',
          data: {},
          marks: [{ type: 'underline' }],
        },
        { nodeType: 'text', value: ', ', data: {}, marks: [] },
        {
          nodeType: 'text',
          value: 'code',
          data: {},
          marks: [{ type: 'code' }],
        },
        { nodeType: 'text', value: '.', data: {}, marks: [] },
      ],
    },
    {
      nodeType: 'heading-1',
      data: {},
      content: [{ nodeType: 'text', value: 'Heading 1', data: {}, marks: [] }],
    },
    {
      nodeType: 'heading-2',
      data: {},
      content: [{ nodeType: 'text', value: 'Heading 2', data: {}, marks: [] }],
    },
    {
      nodeType: 'heading-3',
      data: {},
      content: [{ nodeType: 'text', value: 'Heading 3', data: {}, marks: [] }],
    },
    {
      nodeType: 'heading-4',
      data: {},
      content: [{ nodeType: 'text', value: 'Heading 4', data: {}, marks: [] }],
    },
    {
      nodeType: 'heading-5',
      data: {},
      content: [{ nodeType: 'text', value: 'Heading 5', data: {}, marks: [] }],
    },
    {
      nodeType: 'heading-6',
      data: {},
      content: [{ nodeType: 'text', value: 'Heading 6', data: {}, marks: [] }],
    },
    {
      nodeType: 'unordered-list',
      data: {},
      content: [
        {
          nodeType: 'list-item',
          data: {},
          content: [
            {
              nodeType: 'paragraph',
              data: {},
              content: [
                {
                  nodeType: 'text',
                  value: 'Bullet one',
                  data: {},
                  marks: [],
                },
              ],
            },
          ],
        },
        {
          nodeType: 'list-item',
          data: {},
          content: [
            {
              nodeType: 'paragraph',
              data: {},
              content: [
                {
                  nodeType: 'text',
                  value: 'Bullet two',
                  data: {},
                  marks: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      nodeType: 'ordered-list',
      data: {},
      content: [
        {
          nodeType: 'list-item',
          data: {},
          content: [
            {
              nodeType: 'paragraph',
              data: {},
              content: [
                {
                  nodeType: 'text',
                  value: 'First',
                  data: {},
                  marks: [],
                },
              ],
            },
          ],
        },
        {
          nodeType: 'list-item',
          data: {},
          content: [
            {
              nodeType: 'paragraph',
              data: {},
              content: [
                {
                  nodeType: 'text',
                  value: 'Second',
                  data: {},
                  marks: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      nodeType: 'blockquote',
      data: {},
      content: [
        {
          nodeType: 'paragraph',
          data: {},
          content: [
            {
              nodeType: 'text',
              value: 'A quoted line.',
              data: {},
              marks: [],
            },
          ],
        },
      ],
    },
    { nodeType: 'hr', data: {} },
    {
      nodeType: 'table',
      data: {},
      content: [
        {
          nodeType: 'table-row',
          data: {},
          content: [
            {
              nodeType: 'table-header-cell',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Column A',
                      data: {},
                      marks: [],
                    },
                  ],
                },
              ],
            },
            {
              nodeType: 'table-header-cell',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Column B',
                      data: {},
                      marks: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          nodeType: 'table-row',
          data: {},
          content: [
            {
              nodeType: 'table-cell',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Cell 1',
                      data: {},
                      marks: [],
                    },
                  ],
                },
              ],
            },
            {
              nodeType: 'table-cell',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Cell 2',
                      data: {},
                      marks: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      nodeType: 'paragraph',
      data: {},
      content: [
        { nodeType: 'text', value: 'Visit our ', data: {}, marks: [] },
        {
          nodeType: 'hyperlink',
          data: { url: '/support', label: 'Support page' },
          content: [
            {
              nodeType: 'text',
              value: 'Support page',
              data: {},
              marks: [],
            },
          ],
        },
        { nodeType: 'text', value: ' for help.', data: {}, marks: [] },
      ],
    },
    {
      nodeType: 'embedded-asset-block',
      data: {
        url: MOCK_IMAGES.landscape,
        alt: 'Example embedded image',
      },
    },
  ],
}

export const RICH_TEXT: RichTextTeaser = {
  type: 'richText',
  title: undefined,
  richText: RICH_TEXT_DOCUMENT,
}

export const CAROUSEL_ITEMS: CarouselTeaser['items'] = [
  {
    image: img(MOCK_IMAGES.landscape, 800, 600, 'Summer essentials'),
    caption: 'Summer essentials',
    link: { label: 'Summer essentials', url: '/new' },
  },
  {
    image: img(MOCK_IMAGES.landscape, 800, 600, 'Best sellers'),
    caption: 'Best sellers',
    link: { label: 'Best sellers', url: '/new' },
  },
  {
    image: img(MOCK_IMAGES.landscape, 800, 600, 'Gift ideas'),
    caption: 'Gift ideas',
    link: { label: 'Gift ideas', url: '/new' },
  },
  {
    image: img(MOCK_IMAGES.landscape, 800, 600, 'New arrivals'),
    caption: 'New arrivals',
    link: { label: 'New arrivals', url: '/new' },
  },
  {
    image: img(MOCK_IMAGES.landscape, 800, 600, 'Sale'),
    caption: 'Sale',
    link: { label: 'Sale', url: '/sale' },
  },
  {
    image: img(MOCK_IMAGES.landscape, 800, 600, 'Accessories'),
    caption: 'Accessories',
    link: { label: 'Accessories', url: '/c/accessories' },
  },
  {
    image: img(MOCK_IMAGES.landscape, 800, 600, 'Lookbook'),
    caption: 'Lookbook',
    link: { label: 'Lookbook', url: '/lookbook' },
  },
  {
    image: img(MOCK_IMAGES.landscape, 800, 600, 'Brand story'),
    caption: 'Brand story',
    link: { label: 'Brand story', url: '/about' },
  },
]

export const CAROUSEL: CarouselTeaser = {
  type: 'carousel',
  title: 'Featured',
  items: [...CAROUSEL_ITEMS],
}

export const SLIDER_ITEMS: SliderTeaser['items'] = [
  {
    image: img(MOCK_IMAGES.slide, 1200, 675, 'New arrivals'),
    caption: 'Slide 1 – New arrivals',
    link: { label: 'New arrivals', url: '/new' },
  },
  {
    image: img(MOCK_IMAGES.slide, 1200, 675, 'Best sellers'),
    caption: 'Slide 2 – Best sellers',
    link: { label: 'Best sellers', url: '/new' },
  },
  {
    image: img(MOCK_IMAGES.slide, 1200, 675, 'Sale'),
    caption: 'Slide 3 – Sale',
    link: { label: 'Sale', url: '/sale' },
  },
]

export const SLIDER: SliderTeaser = {
  type: 'slider',
  title: 'Highlights',
  items: [...SLIDER_ITEMS],
}

export const PRODUCT_CAROUSEL: ProductCarouselTeaser = {
  type: 'productCarousel',
  title: 'Featured products',
  categorySlug: 'furniture',
}

export const SECTION: SectionTeaser = {
  type: 'section',
  categoryLabel: 'Category',
  headline: 'Featured collection',
  body: 'Explore a curated selection of everyday essentials and seasonal highlights.',
  subcategoryLinks: [
    { label: 'Category A', url: '/c/category-a' },
    { label: 'Category B', url: '/c/category-b' },
  ],
  image: img(MOCK_IMAGES.landscape, 800, 600, 'Featured collection'),
}

export const REGULAR: RegularTeaser = {
  type: 'regular',
  image: img(MOCK_IMAGES.landscape, 800, 600, 'Summer collection'),
  categoryLabel: 'New in',
  headline: 'Summer collection',
  body: 'Light fabrics and relaxed fits for the warmer days. Free shipping on orders over €50.',
  cta: {
    link: { label: 'Shop now', url: '/new' },
    variant: 'primary',
  },
}

const ACCORDION_ITEMS: AccordionItem[] = [
  {
    title: 'Shipping & delivery',
    body: {
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'paragraph',
          data: {},
          content: [
            {
              nodeType: 'text',
              value:
                'We ship within 2–5 business days. Free shipping on orders over €50.',
              data: {},
              marks: [],
            },
          ],
        },
      ],
    } as RichTextDocumentResponse,
  },
  {
    title: 'Returns',
    body: {
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'paragraph',
          data: {},
          content: [
            {
              nodeType: 'text',
              value:
                'Free returns within 30 days. Contact our support team to start a return.',
              data: {},
              marks: [],
            },
          ],
        },
      ],
    } as RichTextDocumentResponse,
  },
  {
    title: 'Payment methods',
    body: {
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'paragraph',
          data: {},
          content: [
            {
              nodeType: 'text',
              value: 'We accept all major credit cards, PayPal, and Klarna.',
              data: {},
              marks: [],
            },
          ],
        },
      ],
    } as RichTextDocumentResponse,
  },
]

export const ACCORDION: AccordionTeaser = {
  type: 'accordion',
  title: 'FAQ',
  items: ACCORDION_ITEMS,
}
