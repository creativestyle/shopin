import { render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { CarouselScrollbar } from '../carousel-scrollbar'

describe('CarouselScrollbar', () => {
  // Helper component to provide a ref for testing
  function TestWrapper() {
    const scrollerRef = useRef<HTMLDivElement>(null)

    return (
      <div>
        <div
          ref={scrollerRef}
          data-testid='scroller'
        >
          Scroller content
        </div>
        <CarouselScrollbar scrollerRef={scrollerRef} />
      </div>
    )
  }

  describe('Basic rendering', () => {
    it('renders scrollbar with progressbar role', () => {
      render(<TestWrapper />)

      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toBeInTheDocument()
    })

    it('has correct accessibility attributes', () => {
      render(<TestWrapper />)

      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-label')
      expect(progressbar).toHaveAttribute('aria-valuenow')
      expect(progressbar).toHaveAttribute('aria-valuemin', '0')
      expect(progressbar).toHaveAttribute('aria-valuemax', '100')
    })
  })

  describe('Scrollbar structure', () => {
    it('renders track and thumb elements', () => {
      render(<TestWrapper />)

      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toBeInTheDocument()

      // Thumb should be rendered as a child div
      const thumb = progressbar.querySelector('div')
      expect(thumb).toBeInTheDocument()
    })
  })
})
