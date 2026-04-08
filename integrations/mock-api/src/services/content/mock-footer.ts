import type { FooterResponse } from '@core/contracts/content/layout'

export function getMockFooter(): FooterResponse {
  return {
    sections: [
      {
        title: 'Company',
        links: [
          { label: 'Website', url: '#' },
          { label: 'Career', url: '#' },
          { label: 'Sustainability', url: '#' },
          { label: 'For retailers', url: '#' },
          { label: 'Press', url: '#' },
        ],
      },
      {
        title: 'Service',
        links: [
          { label: 'Shopin Club', url: '#' },
          { label: 'Store finder', url: '#' },
          { label: 'Size finder', url: '#' },
          { label: 'Returns', url: '#' },
          { label: 'Help & FAQ', url: '#' },
        ],
      },
    ],
    legalLinks: [],
    copyright: '© Shopin Store. All rights reserved.',
    newsletter: {
      title: 'Subscribe to our newsletter',
      description: 'Get the latest news and',
      voucherText: '10% discount',
      descriptionEnd: 'for new subscribers.',
      signUpLabel: 'Sign up',
    },
    customerService: {
      title: 'Customer service',
      phone: '+49 123 456789',
      hours: 'Mon–Fri 9:00–18:00',
      contactUsLabel: 'Contact us',
    },
    social: {
      title: 'Follow us',
      links: [
        { label: 'Facebook', url: '#' },
        { label: 'Instagram', url: '#' },
        { label: 'YouTube', url: '#' },
      ],
    },
    giftVoucher: {
      title: 'Gift voucher',
      link: { label: 'Buy gift voucher', url: '#' },
    },
    paymentMethods: {
      title: 'Payment methods',
      methods: [
        'Invoice',
        'Prepayment',
        'Apple Pay',
        'PayPal',
        'Amazon Pay',
        'Visa',
        'Mastercard',
        'Amex',
      ],
    },
    shipping: {
      title: 'Shipping',
      items: [{ label: 'DHL', subLabel: 'GoGreen' }, { label: 'DHL Express' }],
    },
    language: {
      title: 'Language',
    },
  }
}
