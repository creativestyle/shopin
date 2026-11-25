import type { ContentPageResponse } from '@core/contracts/content/page'
import { defaultBasePage } from './base'

export function getSupportPage(): ContentPageResponse {
  return {
    ...defaultBasePage,
    slug: 'support',
    parentPageSlug: 'homepage',
    breadcrumb: [
      { label: 'Home', path: '/' },
      { label: 'Support', path: '/support' },
    ],
    pageTitle: 'Support',
    pageTitleVisibility: 'visible',
    components: [
      {
        type: 'headline',
        headline: 'How can we help?',
        subtext: 'Find answers, contact us, or track your order.',
        cta: { link: { label: 'Contact us', url: '/support' } },
      },
      {
        type: 'text',
        body: "Shipping: 2–5 business days. Returns: 30 days, free and easy. Need a different size? We'll exchange it at no extra cost.",
      },
      {
        type: 'image',
        title: 'FAQ',
        caption: 'Common questions and answers.',
        link: { label: 'FAQ', url: '/support' },
      },
      {
        type: 'headline',
        headline: 'Gift cards',
        subtext: 'From €25. Give the perfect present.',
        cta: { link: { label: 'Buy gift card', url: '/new' } },
      },
    ],
  }
}
