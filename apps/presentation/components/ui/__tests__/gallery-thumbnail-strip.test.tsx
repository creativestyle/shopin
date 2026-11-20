import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GalleryThumbnailStrip } from '@/components/ui/gallery-thumbnail-strip'

import type { ImgHTMLAttributes } from 'react'

const mockMatchMedia = (prefersReducedMotion = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches:
        prefersReducedMotion && query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

mockMatchMedia()

global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 0)
  return 1
})

Element.prototype.scrollTo = jest.fn()
Element.prototype.scrollIntoView = jest.fn()

jest.mock('next-intl', () => ({
  useTranslations:
    (ns?: string) =>
    (key: string, values?: { current: number; total: number }) =>
      values
        ? `${ns}.${key} ${values.current}/${values.total}`
        : `${ns}.${key}`,
  useLocale: () => 'en',
}))

/* eslint-disable @next/next/no-img-element -- Mock for testing */
jest.mock('next/image', () => {
  const MockNextImage = (props: ImgHTMLAttributes<HTMLImageElement>) => (
    <img
      alt={props.alt ?? ''}
      {...props}
    />
  )
  MockNextImage.displayName = 'MockNextImage'
  return MockNextImage
})
/* eslint-enable @next/next/no-img-element */

const createImages = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    src: `/image-${i}.jpg`,
    alt: `Image ${i}`,
  }))

describe('GalleryThumbnailStrip', () => {
  it.each([0, 1])('renders nothing for %i image(s)', (count) => {
    const { container } = render(
      <GalleryThumbnailStrip
        images={createImages(count)}
        selectedIndex={0}
        onSelect={jest.fn()}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders a thumbnail per image and marks the selected one', () => {
    render(
      <GalleryThumbnailStrip
        images={createImages(4)}
        selectedIndex={2}
        onSelect={jest.fn()}
      />
    )

    const thumbnails = screen.getAllByRole('button')
    expect(thumbnails).toHaveLength(4)
    thumbnails.forEach((thumbnail, idx) => {
      expect(thumbnail).toHaveAttribute('aria-pressed', String(idx === 2))
    })
  })

  it('calls onSelect with the clicked thumbnail index', async () => {
    const user = userEvent.setup()
    const onSelect = jest.fn()
    render(
      <GalleryThumbnailStrip
        images={createImages(4)}
        selectedIndex={0}
        onSelect={onSelect}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Image 3' }))

    expect(onSelect).toHaveBeenCalledWith(3)
  })

  it('updates aria-pressed when selectedIndex changes', () => {
    const props = { images: createImages(4), onSelect: jest.fn() }
    const { rerender } = render(
      <GalleryThumbnailStrip
        {...props}
        selectedIndex={0}
      />
    )

    rerender(
      <GalleryThumbnailStrip
        {...props}
        selectedIndex={1}
      />
    )

    expect(screen.getByRole('button', { name: 'Image 0' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    expect(screen.getByRole('button', { name: 'Image 1' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('falls back to a translated label when an image has no alt', () => {
    render(
      <GalleryThumbnailStrip
        images={[{ src: '/a.jpg' }, { src: '/b.jpg' }]}
        selectedIndex={0}
        onSelect={jest.fn()}
      />
    )

    expect(
      screen.getByRole('button', { name: 'product.gallery.thumbnailAria 1/2' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'product.gallery.thumbnailAria 2/2' })
    ).toBeInTheDocument()
  })

  it('renders a plain row for up to 6 images', () => {
    render(
      <GalleryThumbnailStrip
        images={createImages(6)}
        selectedIndex={0}
        onSelect={jest.fn()}
      />
    )

    expect(screen.queryByRole('region')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(6)
  })

  it('switches to a carousel for more than 6 images', () => {
    render(
      <GalleryThumbnailStrip
        images={createImages(7)}
        selectedIndex={0}
        onSelect={jest.fn()}
      />
    )

    expect(screen.getByRole('region')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(6)
    expect(screen.getByRole('button', { pressed: true })).toHaveAccessibleName(
      'Image 0'
    )
  })

  describe('scrolling the selected thumbnail into view', () => {
    afterEach(() => {
      mockMatchMedia()
    })

    const changeSelection = () => {
      const props = { images: createImages(4), onSelect: jest.fn() }
      const { rerender } = render(
        <GalleryThumbnailStrip
          {...props}
          selectedIndex={0}
        />
      )
      rerender(
        <GalleryThumbnailStrip
          {...props}
          selectedIndex={2}
        />
      )
    }

    it('scrolls smoothly by default', () => {
      changeSelection()

      expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('scrolls instantly when the user prefers reduced motion', () => {
      mockMatchMedia(true)

      changeSelection()

      expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith(
        expect.objectContaining({ behavior: 'auto' })
      )
    })
  })
})
