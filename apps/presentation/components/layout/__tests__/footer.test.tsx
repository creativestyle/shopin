import { render, screen } from '@testing-library/react'
import type { FooterResponse } from '@core/contracts/content/layout'
import { Footer } from '../footer'
import { getFooterLayout } from '@/features/content/get-layout'

jest.mock('@/features/content/get-layout', () => ({
  getFooterLayout: jest.fn(),
}))
jest.mock('next-intl/server', () => ({
  getTranslations: async (ns: string) => (key: string) => `${ns}.${key}`,
}))
jest.mock('@/features/cookie-consent/cookie-footer-trigger', () => ({
  CookieFooterTrigger: () => null,
}))
jest.mock('@/hooks/use-language-switcher', () => ({
  useLanguageSwitcher: () => ({ isOpen: false }),
}))
jest.mock('@/components/layout/language-trigger', () => ({
  LanguageTrigger: () => null,
}))

const filledLayout: FooterResponse = {
  sections: [
    {
      title: 'Shop',
      links: [{ label: 'About us', url: '/about' }],
    },
  ],
  legalLinks: [{ label: 'Imprint', url: '/imprint' }],
  copyright: '© Shop',
  newsletter: { title: 'Join our newsletter', description: 'Get news' },
  customerService: {
    title: 'Customer service',
    phone: '+49 (0) 30 123456789',
    hours: 'Mon–Fri 9–17',
    contactUs: { label: 'Contact us', url: '/support' },
  },
  paymentMethods: { title: 'Payment', methods: ['Visa'] },
  country: { title: 'Country' },
}

async function renderFooter(layout: FooterResponse | null) {
  jest.mocked(getFooterLayout).mockResolvedValue(layout)
  render(await Footer())
}

describe('Footer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes isDraft to getFooterLayout', async () => {
    jest.mocked(getFooterLayout).mockResolvedValue(null)
    await Footer({ isDraft: true })
    expect(getFooterLayout).toHaveBeenCalledWith(true)
  })

  it.each([
    ['null', null],
    ['empty', { sections: [], legalLinks: [] }],
  ])(
    'renders only the translated copyright for a %s layout',
    async (_, layout) => {
      await renderFooter(layout)
      expect(screen.getByText('legalBar.copyright')).toBeInTheDocument()
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    }
  )

  it('renders every block from a filled layout', async () => {
    await renderFooter(filledLayout)
    for (const heading of [
      'Join our newsletter',
      'Shop',
      'Customer service',
      'Payment',
      'Country',
    ]) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'About us' })).toHaveAttribute(
      'href',
      '/about'
    )
    expect(screen.getByRole('link', { name: 'Contact us' })).toHaveAttribute(
      'href',
      '/support'
    )
    expect(screen.getByRole('link', { name: 'Imprint' })).toBeInTheDocument()
    expect(screen.getByText('Mon–Fri 9–17')).toBeInTheDocument()
    expect(screen.getByText('Visa')).toBeInTheDocument()
    expect(screen.getByText('© Shop')).toBeInTheDocument()
    expect(screen.queryByText('legalBar.copyright')).not.toBeInTheDocument()
  })

  it('links the phone number with a dialable tel uri', async () => {
    await renderFooter(filledLayout)
    expect(screen.getByRole('link', { name: 'footer.callUs' })).toHaveAttribute(
      'href',
      'tel:+4930123456789'
    )
  })

  it('falls back to the translated country title', async () => {
    await renderFooter({ ...filledLayout, country: undefined })
    expect(
      screen.getByRole('heading', { name: 'languageSwitcher.footerTitle' })
    ).toBeInTheDocument()
  })

  it('renders customer service without a heading when it has no title', async () => {
    await renderFooter({
      ...filledLayout,
      customerService: { title: '', phone: '+49 30 123456789' },
    })
    expect(
      screen.queryByRole('heading', { name: 'Customer service' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'footer.callUs' })).toHaveAttribute(
      'href',
      'tel:+4930123456789'
    )
  })
})
