import { act, fireEvent, render, screen, within } from '@testing-library/react'
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
    await user.click(screen.getByRole('button', { name: /closeButtonAria/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  describe('lightbox thumbnails', () => {
    const openDialogAt = (index: number) => {
      render(
        <ProductGallery
          images={images}
          initialVisible={4}
        />
      )
      fireEvent.click(
        screen.getAllByRole('button', { name: 'Open image in lightbox' })[index]
      )
      return within(screen.getByRole('dialog'))
    }

    const scrollMainCarouselTo = (dialog: HTMLElement, index: number) => {
      const scroller = dialog.querySelector<HTMLElement>(
        '[data-role=carousel] [role=group]'
      )!
      const slideWidth = 100
      Object.defineProperty(scroller, 'scrollWidth', {
        configurable: true,
        value: slideWidth * images.length,
      })
      Object.defineProperty(scroller, 'clientWidth', {
        configurable: true,
        value: slideWidth,
      })
      Object.defineProperty(scroller, 'scrollLeft', {
        configurable: true,
        value: slideWidth * index,
      })
      fireEvent.scroll(scroller)
    }

    const expectSelected = (
      dialog: ReturnType<typeof within>,
      name: string
    ) => {
      expect(
        dialog.getByRole('button', { pressed: true })
      ).toHaveAccessibleName(name)
    }

    afterEach(() => {
      jest.useRealTimers()
    })

    it('highlights the image the dialog was opened on', () => {
      const dialog = openDialogAt(1)

      expectSelected(dialog, 'B')
    })

    it('selects the clicked thumbnail', async () => {
      const user = userEvent.setup()
      const dialog = openDialogAt(0)

      await user.click(dialog.getByRole('button', { name: 'C' }))

      expectSelected(dialog, 'C')
      expect(dialog.getByRole('button', { name: 'A' })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
    })

    it('follows the main carousel when it is scrolled', () => {
      const dialog = openDialogAt(0)

      scrollMainCarouselTo(screen.getByRole('dialog'), 3)

      expectSelected(dialog, 'D')
    })

    it('ignores intermediate slides while scrolling to the start image', () => {
      jest.useFakeTimers()
      const dialog = openDialogAt(2)

      scrollMainCarouselTo(screen.getByRole('dialog'), 1)
      expectSelected(dialog, 'C')

      act(() => jest.advanceTimersByTime(150))
      scrollMainCarouselTo(screen.getByRole('dialog'), 2)
      act(() => jest.advanceTimersByTime(150))
      scrollMainCarouselTo(screen.getByRole('dialog'), 3)
      act(() => jest.advanceTimersByTime(150))

      expectSelected(dialog, 'D')
    })

    it('resyncs with the carousel when a thumbnail scroll is interrupted', () => {
      jest.useFakeTimers()
      const dialog = openDialogAt(0)

      fireEvent.click(dialog.getByRole('button', { name: 'D' }))
      scrollMainCarouselTo(screen.getByRole('dialog'), 1)
      expectSelected(dialog, 'D')

      act(() => jest.advanceTimersByTime(400))

      expectSelected(dialog, 'B')
    })
  })
})
