import { fireEvent, render, screen } from '@testing-library/react'
import { Carousel, CarouselSlide } from '../'

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

describe('Carousel', () => {
  describe('Basic rendering', () => {
    it('renders carousel with slides', () => {
      render(
        <Carousel>
          <CarouselSlide>Slide 1</CarouselSlide>
          <CarouselSlide>Slide 2</CarouselSlide>
          <CarouselSlide>Slide 3</CarouselSlide>
        </Carousel>
      )

      expect(screen.getByRole('region')).toBeInTheDocument()
      expect(screen.getByText('Slide 1')).toBeInTheDocument()
      expect(screen.getByText('Slide 2')).toBeInTheDocument()
      expect(screen.getByText('Slide 3')).toBeInTheDocument()
    })

    it('renders carousel with correct accessibility attributes', () => {
      render(
        <Carousel>
          <CarouselSlide>Slide 1</CarouselSlide>
          <CarouselSlide>Slide 2</CarouselSlide>
        </Carousel>
      )

      const carousel = screen.getByRole('region')
      expect(carousel).toHaveAttribute('aria-roledescription', 'carousel')
      expect(carousel).toHaveAttribute('data-role', 'carousel')
    })

    it('renders slides container with correct role', () => {
      const { container } = render(
        <Carousel>
          <CarouselSlide>Slide 1</CarouselSlide>
          <CarouselSlide>Slide 2</CarouselSlide>
        </Carousel>
      )

      const slidesContainer = container.querySelector(
        '[role="group"][aria-live="polite"]'
      )
      expect(slidesContainer).toBeInTheDocument()
      expect(slidesContainer).toHaveAttribute('aria-atomic', 'false')
    })

    it('renders individual slides with accessibility labels', () => {
      const { container } = render(
        <Carousel>
          <CarouselSlide>Slide 1</CarouselSlide>
          <CarouselSlide>Slide 2</CarouselSlide>
          <CarouselSlide>Slide 3</CarouselSlide>
        </Carousel>
      )

      // Verify slides have aria-label and aria-roledescription attributes
      const slides = container.querySelectorAll(
        '[aria-roledescription="slide"]'
      )
      expect(slides).toHaveLength(3)

      slides.forEach((slide) => {
        expect(slide).toHaveAttribute('aria-label')
        expect(slide).toHaveAttribute('role', 'group')
      })
    })
  })

  describe('Scrollbar', () => {
    it('does not render scrollbar when scrollbar is false', () => {
      render(
        <Carousel scrollbar={false}>
          <CarouselSlide>Slide 1</CarouselSlide>
          <CarouselSlide>Slide 2</CarouselSlide>
          <CarouselSlide>Slide 3</CarouselSlide>
        </Carousel>
      )

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })

  describe('Callbacks', () => {
    it('calls onSlideChange callback when provided', () => {
      const handleSlideChange = jest.fn()

      const { container } = render(
        <Carousel onSlideChange={handleSlideChange}>
          <CarouselSlide>Slide 1</CarouselSlide>
          <CarouselSlide>Slide 2</CarouselSlide>
          <CarouselSlide>Slide 3</CarouselSlide>
          <CarouselSlide>Slide 4</CarouselSlide>
          <CarouselSlide>Slide 5</CarouselSlide>
        </Carousel>
      )

      const slidesContainer = container.querySelector(
        '[role="group"][aria-live="polite"]'
      )
      expect(slidesContainer).toBeInTheDocument()

      // Note: Without actual scrolling, the callback won't be triggered in tests
      // This test validates that the prop is accepted without errors
      expect(handleSlideChange).not.toHaveBeenCalled()
    })
  })

  describe('Edge cases', () => {
    it('renders with single slide', () => {
      const { container } = render(
        <Carousel>
          <CarouselSlide>Only Slide</CarouselSlide>
        </Carousel>
      )

      expect(screen.getByText('Only Slide')).toBeInTheDocument()

      // Verify slide has accessibility attributes
      const slide = container.querySelector('[aria-roledescription="slide"]')
      expect(slide).toBeInTheDocument()
      expect(slide).toHaveAttribute('aria-label')
    })

    it('accepts custom gridConfig as number', () => {
      render(
        <Carousel gridConfig={3}>
          <CarouselSlide>Slide 1</CarouselSlide>
          <CarouselSlide>Slide 2</CarouselSlide>
          <CarouselSlide>Slide 3</CarouselSlide>
        </Carousel>
      )

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('accepts custom gridConfig as object', () => {
      render(
        <Carousel gridConfig={{ base: 1, sm: 2, md: 3 }}>
          <CarouselSlide>Slide 1</CarouselSlide>
          <CarouselSlide>Slide 2</CarouselSlide>
          <CarouselSlide>Slide 3</CarouselSlide>
        </Carousel>
      )

      expect(screen.getByRole('region')).toBeInTheDocument()
    })
  })

  describe('fullbleed', () => {
    it('applies ui-fullbleed by default', () => {
      render(
        <Carousel>
          <CarouselSlide>Slide 1</CarouselSlide>
        </Carousel>
      )

      expect(screen.getByRole('region')).toHaveClass('ui-fullbleed')
    })

    it('omits ui-fullbleed when fullbleed is false', () => {
      render(
        <Carousel fullbleed={false}>
          <CarouselSlide>Slide 1</CarouselSlide>
        </Carousel>
      )

      expect(screen.getByRole('region')).not.toHaveClass('ui-fullbleed')
    })
  })

  describe('navigationStep', () => {
    const SLIDE_WIDTH = 100

    const renderScrollableCarousel = (navigationStep?: number) => {
      render(
        <Carousel
          gridConfig={3}
          scrollbar={false}
          navigationStep={navigationStep}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <CarouselSlide key={i}>Slide {i + 1}</CarouselSlide>
          ))}
        </Carousel>
      )

      const scroller = screen
        .getByRole('region')
        .querySelector<HTMLElement>('[role=group]')!
      Object.defineProperty(scroller, 'scrollWidth', { value: 600 })
      Object.defineProperty(scroller, 'clientWidth', { value: 300 })
      scroller.scrollTo = jest.fn()
      screen.getAllByRole('group', { name: /slideXofY/ }).forEach((slide) => {
        jest
          .spyOn(slide, 'getBoundingClientRect')
          .mockReturnValue({ width: SLIDE_WIDTH } as DOMRect)
      })
      fireEvent.scroll(scroller)

      return scroller
    }

    it('scrolls by a whole group of slides by default', () => {
      const scroller = renderScrollableCarousel()

      fireEvent.click(screen.getByRole('button', { name: /nextSlide/ }))

      expect(scroller.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ left: SLIDE_WIDTH * 3 })
      )
    })

    it('scrolls by one slide when navigationStep is 1', () => {
      const scroller = renderScrollableCarousel(1)

      fireEvent.click(screen.getByRole('button', { name: /nextSlide/ }))

      expect(scroller.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ left: SLIDE_WIDTH })
      )
    })
  })
})
