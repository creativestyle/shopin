import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import type { BannerTeaser } from '@core/contracts/content/teaser-banner'
import { TeaserBannerBlock } from '../teasers/teaser-banner-block'

jest.mock('@/lib/navigation', () => ({
  Link: ({ children, ...props }: { children?: ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}))

jest.mock('@/features/content/content-image', () => ({
  ContentImage: () => null,
}))

const baseTeaser: BannerTeaser = {
  type: 'banner',
  backgroundImage: { url: 'https://img.test/banner.jpg', alt: 'Banner' },
  headline: 'Winter sale',
  body: 'Up to 50% off',
}

describe('TeaserBannerBlock', () => {
  it('renders the CTA as the single link with href, target and rel', () => {
    render(
      <TeaserBannerBlock
        teaser={{
          ...baseTeaser,
          cta: {
            link: { label: 'Shop now', url: '/sale', target: '_blank' },
          },
        }}
      />
    )

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAccessibleName('Shop now')
    expect(links[0]).toHaveAttribute('href', '/sale')
    expect(links[0]).toHaveAttribute('target', '_blank')
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('uses the CTA ariaLabel as the accessible name when set', () => {
    render(
      <TeaserBannerBlock
        teaser={{
          ...baseTeaser,
          cta: {
            link: {
              label: 'Shop now',
              url: '/sale',
              ariaLabel: 'Shop the winter sale',
            },
          },
        }}
      />
    )

    expect(screen.getByRole('link')).toHaveAccessibleName(
      'Shop the winter sale'
    )
  })

  it('stretches the CTA link over the whole banner', () => {
    render(
      <TeaserBannerBlock
        teaser={{
          ...baseTeaser,
          cta: { link: { label: 'Shop now', url: '/sale' } },
        }}
      />
    )

    expect(screen.getByRole('link')).toHaveClass(
      'after:absolute',
      'after:inset-0'
    )
  })

  it('renders no link when the CTA has no URL', () => {
    render(
      <TeaserBannerBlock
        teaser={{ ...baseTeaser, cta: { link: { label: 'Shop now' } } }}
      />
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText('Shop now')).not.toBeInTheDocument()
    expect(screen.getByText('Winter sale')).toBeInTheDocument()
  })
})
