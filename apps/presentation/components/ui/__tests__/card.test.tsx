import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui/card'

describe('Card', () => {
  it('renders children content', () => {
    render(<Card data-testid='card'>Test Content</Card>)
    const card = screen.getByTestId('card')
    expect(card).toBeInTheDocument()
    expect(card).toHaveTextContent('Test Content')
  })

  it('renders as a div element', () => {
    render(<Card data-testid='card'>Content</Card>)
    const card = screen.getByTestId('card')
    expect(card.tagName).toBe('DIV')
  })

  it('passes through HTML attributes', () => {
    render(
      <Card
        data-testid='card'
        id='test-id'
        role='region'
        aria-label='Test card'
      >
        Content
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveAttribute('id', 'test-id')
    expect(card).toHaveAttribute('role', 'region')
    expect(card).toHaveAttribute('aria-label', 'Test card')
  })

  it('applies custom className', () => {
    render(
      <Card
        className='custom-class'
        data-testid='card'
      >
        Content
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('custom-class')
  })

  it('renders complex children', () => {
    render(
      <Card data-testid='card'>
        <h2>Heading</h2>
        <p>Paragraph</p>
        <button>Button</button>
      </Card>
    )
    expect(screen.getByRole('heading', { name: 'Heading' })).toBeInTheDocument()
    expect(screen.getByText('Paragraph')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument()
  })
})
