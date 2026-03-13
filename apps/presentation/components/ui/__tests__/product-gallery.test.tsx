import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductGallery } from '@/components/ui/product-gallery'

import type { ImgHTMLAttributes } from 'react'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock requestAnimationFrame for jsdom
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 0)
  return 1
})

// Mock scrollTo for jsdom
Element.prototype.scrollTo = jest.fn()

/* eslint-disable @next/next/no-img-element -- Mock for testing */
jest.mock('next/image', () => {
  const MockNextImage = (props: ImgHTMLAttributes<HTMLImageElement>) => {
    return (
      <img
        alt={props.alt ?? ''}
        {...props}
      />
    )
  }
  MockNextImage.displayName = 'MockNextImage'
  return MockNextImage
})
/* eslint-enable @next/next/no-img-element */

describe('ProductGallery', () => {
  const images = [
    { src: '/a.jpg', alt: 'A' },
    { src: '/b.jpg', alt: 'B' },
    { src: '/c.jpg', alt: 'C' },
    { src: '/d.jpg', alt: 'D' },
  ]

  it('loads more tiles when clicking load more', async () => {
    const user = userEvent.setup()
    render(
      <ProductGallery
        images={images}
        initialVisible={2}
      />
    )
    const btn = screen.getByTestId('load-more-photos')
    await user.click(btn)
    // With 4 images total, after clicking load more (adds 4), button should disappear
    expect(
      screen.queryByRole('button', { name: /load more photos/i })
    ).toBeNull()
  })

  it('opens and closes lightbox on image click', async () => {
    const user = userEvent.setup()
    render(
      <ProductGallery
        images={images}
        initialVisible={2}
      />
    )
    // click first visible image by its alt
    // Since we stub img, we open via the container button in GalleryImage
    // Find all buttons then click first one
    const clickable = screen.getAllByRole('button')
    await user.click(clickable[0])
    // lightbox dialog should open
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // close by clicking close button in GalleryDialog
    await user.click(screen.getByRole('button', { name: /close lightbox/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
