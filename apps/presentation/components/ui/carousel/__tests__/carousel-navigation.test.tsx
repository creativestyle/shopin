import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CarouselNavigation } from '../carousel-navigation'

describe('CarouselNavigation', () => {
  const defaultProps = {
    currentIndex: 1,
    isNextSlidePossible: true,
    onSlideToPrev: jest.fn(),
    onSlideToNext: jest.fn(),
    carouselId: 'test-carousel-id',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Helper function to get next button by aria-label
  const getNextButton = () => {
    return screen.queryByRole('button', { name: /next/i })
  }

  // Helper function to get previous button by aria-label
  const getPrevButton = () => {
    return screen.queryByRole('button', { name: /previous/i })
  }

  describe('Basic rendering', () => {
    it('renders next button when next slide is possible', () => {
      render(<CarouselNavigation {...defaultProps} />)

      const nextButton = getNextButton()
      expect(nextButton).toBeInTheDocument()
    })

    it('does not render previous button when at start', () => {
      render(
        <CarouselNavigation
          {...defaultProps}
          currentIndex={1}
        />
      )

      const prevButton = getPrevButton()
      expect(prevButton).not.toBeInTheDocument()
    })

    it('renders previous button when not at start', () => {
      render(
        <CarouselNavigation
          {...defaultProps}
          currentIndex={2}
        />
      )

      const prevButton = getPrevButton()
      expect(prevButton).toBeInTheDocument()
    })

    it('does not render next button when next slide is not possible', () => {
      render(
        <CarouselNavigation
          {...defaultProps}
          isNextSlidePossible={false}
        />
      )

      const nextButton = getNextButton()
      expect(nextButton).not.toBeInTheDocument()
    })
  })

  describe('User interactions', () => {
    it('calls onSlideToPrev when previous button is clicked', async () => {
      const user = userEvent.setup()
      const onSlideToPrev = jest.fn()

      render(
        <CarouselNavigation
          {...defaultProps}
          currentIndex={2}
          onSlideToPrev={onSlideToPrev}
        />
      )

      const prevButton = getPrevButton()
      expect(prevButton).toBeInTheDocument()
      await user.click(prevButton!)

      expect(onSlideToPrev).toHaveBeenCalledTimes(1)
    })

    it('calls onSlideToNext when next button is clicked', async () => {
      const user = userEvent.setup()
      const onSlideToNext = jest.fn()

      render(
        <CarouselNavigation
          {...defaultProps}
          onSlideToNext={onSlideToNext}
        />
      )

      const nextButton = getNextButton()
      expect(nextButton).toBeInTheDocument()
      await user.click(nextButton!)

      expect(onSlideToNext).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge cases', () => {
    it('renders with only next button visible', () => {
      render(
        <CarouselNavigation
          {...defaultProps}
          currentIndex={1}
          isNextSlidePossible={true}
        />
      )

      expect(getPrevButton()).not.toBeInTheDocument()
      expect(getNextButton()).toBeInTheDocument()
    })

    it('renders with no buttons when at start and next not possible', () => {
      render(
        <CarouselNavigation
          {...defaultProps}
          currentIndex={1}
          isNextSlidePossible={false}
        />
      )

      expect(getPrevButton()).not.toBeInTheDocument()
      expect(getNextButton()).not.toBeInTheDocument()
    })
  })
})
