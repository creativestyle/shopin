import type { FooterResponse } from '@core/contracts/content/layout'

export function getMockFooter(): FooterResponse {
  return {
    sections: [
      {
        title: 'Company',
        links: [
          { label: 'About us', url: '/about' },
          { label: 'Support', url: '/support' },
        ],
      },
    ],
    legalLinks: [],
    copyright: '© 2026 SHOPin frontend accelerator / creativestyle GmbH.',
    newsletter: {
      title: 'Subscribe to our newsletter',
      description: 'Get the latest news and',
      voucherText: '10% discount',
      descriptionEnd: 'for new subscribers.',
      signUpLabel: 'Sign up',
    },
    customerService: {
      title: 'Customer service',
      phone: '+49 DEMO · SHOPin accelerator (please don’t call — it’s pretend)',
      hours: 'Mon–Fri 9:00–18:00',
      contactUs: {
        label: 'Contact us',
        url: 'https://shopin.dev',
        target: '_blank',
      },
    },
    paymentMethods: {
      title: 'Payment methods',
      methods: ['Demo'],
    },
    country: {
      title: 'Country',
    },
  }
}
