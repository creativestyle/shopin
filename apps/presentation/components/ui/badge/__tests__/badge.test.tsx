import { render, screen } from '@testing-library/react'
import { Badge } from '../badge'

describe('Badge', () => {
  describe('Basic rendering and text content', () => {
    it('renders with text content', () => {
      render(<Badge>Sample Badge</Badge>)
      expect(screen.getByText('Sample Badge')).toBeInTheDocument()
    })

    it('renders as a span element by default', () => {
      render(<Badge>Default Badge</Badge>)
      const badge = screen.getByText('Default Badge')
      expect(badge.tagName).toBe('SPAN')
    })

    it('renders with custom className', () => {
      render(<Badge className='custom-class'>Custom Badge</Badge>)
      const badge = screen.getByText('Custom Badge')
      expect(badge).toHaveClass('custom-class')
    })

    it('renders with custom data attributes', () => {
      render(<Badge data-testid='test-badge'>Test Badge</Badge>)
      expect(screen.getByTestId('test-badge')).toBeInTheDocument()
    })

    it('renders without children', () => {
      const { container } = render(<Badge />)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveAttribute('data-slot', 'badge')
    })
  })

  describe('asChild functionality', () => {
    it('renders as anchor tag when asChild is true and anchor is provided', () => {
      render(
        <Badge asChild>
          <a href='https://example.com/test'>Link Badge</a>
        </Badge>
      )

      const link = screen.getByRole('link', { name: 'Link Badge' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com/test')
      expect(link).toHaveAttribute('data-slot', 'badge')
    })

    it('marks child with badge data attributes when asChild is true', () => {
      render(
        <Badge
          variant='orange'
          asChild
        >
          <a href='https://example.com/test'>Styled Link Badge</a>
        </Badge>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('data-slot', 'badge')
    })

    it('preserves child element props when asChild is true', () => {
      render(
        <Badge asChild>
          <a
            href='https://example.com'
            target='_blank'
            rel='noopener noreferrer'
          >
            External Link Badge
          </a>
        </Badge>
      )

      const link = screen.getByRole('link', { name: 'External Link Badge' })
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('Common props and attributes', () => {
    it('forwards additional props to the rendered element', () => {
      render(
        <Badge
          id='test-id'
          title='Test title'
        >
          Badge with props
        </Badge>
      )
      const badge = screen.getByText('Badge with props')
      expect(badge).toHaveAttribute('id', 'test-id')
      expect(badge).toHaveAttribute('title', 'Test title')
    })
  })

  describe('Edge cases', () => {
    it('handles number as children', () => {
      render(<Badge>{42}</Badge>)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('handles multiple text nodes', () => {
      render(
        <Badge>
          {'Hello'} {'World'}
        </Badge>
      )
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })
  })
})
