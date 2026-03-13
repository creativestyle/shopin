import { render, screen } from '@testing-library/react'
import { CarouselSlide } from '../carousel-slide'

describe('CarouselSlide', () => {
  describe('Basic rendering', () => {
    it('renders slide with children', () => {
      render(<CarouselSlide>Slide Content</CarouselSlide>)

      expect(screen.getByText('Slide Content')).toBeInTheDocument()
    })

    it('renders with complex children', () => {
      render(
        <CarouselSlide>
          <div>
            <h3>Title</h3>
            <p>Description</p>
          </div>
        </CarouselSlide>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(
        <CarouselSlide className='custom-slide-class'>Content</CarouselSlide>
      )

      const slide = container.querySelector('.custom-slide-class')
      expect(slide).toBeInTheDocument()
      expect(slide).toHaveTextContent('Content')
    })
  })

  describe('Content structure', () => {
    it('renders multiple child elements', () => {
      render(
        <CarouselSlide>
          <span data-testid='child-1'>First</span>
          <span data-testid='child-2'>Second</span>
        </CarouselSlide>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
    })
  })
})
