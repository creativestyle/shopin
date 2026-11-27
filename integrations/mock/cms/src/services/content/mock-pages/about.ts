import type { ContentPageResponse } from '@core/contracts/content/page'
import type { RichTextDocumentResponse } from '@core/contracts/content/rich-text-document'
import type { ContentImage } from '@core/contracts/content/content-image'
import { defaultBasePage, placeholderImage } from './base'

const ourValuesRichText: RichTextDocumentResponse = {
  nodeType: 'document',
  data: {},
  content: [
    {
      nodeType: 'heading-3',
      data: {},
      content: [{ nodeType: 'text', value: 'Our values', data: {}, marks: [] }],
    },
    {
      nodeType: 'paragraph',
      data: {},
      content: [
        {
          nodeType: 'text',
          value: 'Quality · Transparency · Community · Innovation.',
          data: {},
          marks: [],
        },
      ],
    },
  ],
}

export function getAboutPage(
  placeholder: (
    w: number,
    h: number,
    title?: string
  ) => ContentImage = placeholderImage
): ContentPageResponse {
  return {
    ...defaultBasePage,
    slug: 'about',
    parentPageSlug: 'homepage',
    breadcrumb: [
      { label: 'Home', path: '/' },
      { label: 'About', path: '/about' },
    ],
    pageTitle: 'About us',
    pageTitleVisibility: 'visible',
    components: [
      {
        type: 'headline',
        headline: 'Our story',
        subtext:
          'We started with a simple idea: bring great design to everyone.',
      },
      {
        type: 'image',
        title: 'Our team',
        image: placeholder(600, 300, 'Our team'),
        caption: 'Meet the people behind the brand.',
        link: { label: 'Our team', url: '/about' },
      },
      {
        type: 'text',
        body: 'Founded in 2020, we work with designers and makers around the world. Sustainability and fair practices are at the heart of what we do.',
      },
      {
        type: 'richText',
        title: 'Our values',
        richText: ourValuesRichText,
      },
    ],
  }
}
