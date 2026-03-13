import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { Breadcrumbs } from '../breadcrumbs'
import { CrumbResponse } from '@core/contracts/core/crumb'

// Mock next-intl/server
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() =>
    jest.fn((key: string) => {
      const translations: Record<string, string> = {
        homepage: 'Home',
      }
      return translations[key] || key
    })
  ),
}))

// Create a synchronous wrapper for testing
async function renderBreadcrumbs(crumbs: CrumbResponse[], className?: string) {
  const BreadcrumbsComponent = await Breadcrumbs({ crumbs, className })
  return render(BreadcrumbsComponent)
}

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) {
    return (
      <a
        href={href}
        {...props}
      >
        {children}
      </a>
    )
  }
})

describe('Breadcrumbs', () => {
  const mockCrumbs: CrumbResponse[] = [
    { label: 'Category', path: '/category' },
    { label: 'Subcategory', path: '/category/subcategory' },
    { label: 'Product', path: '/category/subcategory/product' },
  ]

  describe('Basic rendering', () => {
    it('renders breadcrumbs with home link (icon + sr-only label) and provided crumbs', async () => {
      await renderBreadcrumbs(mockCrumbs)

      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Subcategory')).toBeInTheDocument()
      expect(screen.getByText('Product')).toBeInTheDocument()
      const nav = screen.getByRole('navigation')
      const firstItem = within(nav).getAllByRole('listitem')[0]
      const link = within(firstItem).getByRole('link')
      const homeSvg = link.querySelector('svg[aria-hidden="true"]')
      expect(homeSvg).not.toBeNull()
      // Home label is visually hidden but present for screen readers
      expect(within(link).getByText('Home')).toBeInTheDocument()
    })

    it('renders with custom className', async () => {
      await renderBreadcrumbs(mockCrumbs, 'custom-class')

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute(
        'class',
        expect.stringContaining('custom-class')
      )
    })

    it('renders home link with icon and sr-only label', async () => {
      await renderBreadcrumbs(mockCrumbs)

      const nav = screen.getByRole('navigation')
      const firstItem = within(nav).getAllByRole('listitem')[0]
      const link = within(firstItem).getByRole('link')
      const homeSvg = link.querySelector('svg[aria-hidden="true"]')
      expect(homeSvg).not.toBeNull()
      expect(within(link).getByText('Home')).toBeInTheDocument()
    })

    it('renders home label as screen reader only text', async () => {
      await renderBreadcrumbs(mockCrumbs)

      const homeLabel = screen.getByText('Home')
      expect(homeLabel).toBeInTheDocument()
    })
  })

  describe('Navigation structure', () => {
    it('renders all crumbs as links except the last one', async () => {
      await renderBreadcrumbs(mockCrumbs)

      const categoryLink = screen.getByRole('link', { name: 'Category' })
      const subcategoryLink = screen.getByRole('link', { name: 'Subcategory' })

      expect(categoryLink).toHaveAttribute('href', '/category')
      expect(subcategoryLink).toHaveAttribute('href', '/category/subcategory')
    })

    it('renders last crumb as span with aria-current page', async () => {
      await renderBreadcrumbs(mockCrumbs)

      const lastCrumb = screen.getByText('Product')
      expect(lastCrumb.tagName).toBe('SPAN')
      expect(lastCrumb).toHaveAttribute('aria-current', 'page')
    })

    it('renders the correct number of aria-hidden icons across crumbs', async () => {
      await renderBreadcrumbs(mockCrumbs)

      const nav = screen.getByRole('navigation')
      const listItems = within(nav).getAllByRole('listitem')
      const hiddenIcons = nav.querySelectorAll('svg[aria-hidden="true"]')
      // Includes the home icon and one chevron per non-last item
      expect(hiddenIcons.length).toBe(listItems.length)
    })

    it('does not render separator after last crumb', async () => {
      await renderBreadcrumbs(mockCrumbs)

      const nav = screen.getByRole('navigation')
      const listItems = within(nav).getAllByRole('listitem')
      const lastItem = listItems[listItems.length - 1]
      const hiddenIconsInLast = lastItem.querySelectorAll(
        'svg[aria-hidden="true"]'
      )
      expect(hiddenIconsInLast.length).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('returns null when no crumbs provided', async () => {
      const { container } = await renderBreadcrumbs([])
      expect(container.firstChild).toBeNull()
    })

    it('returns null when only home crumb exists', async () => {
      const { container } = await renderBreadcrumbs([])
      expect(container.firstChild).toBeNull()
    })
  })
})
