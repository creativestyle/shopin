import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

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

describe('Button', () => {
  const user = userEvent.setup()

  describe('Basic rendering and props', () => {
    it('renders as a button by default', () => {
      render(<Button>Click me</Button>)
      expect(
        screen.getByRole('button', { name: 'Click me' })
      ).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      render(<Button className='custom-class'>Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('renders with custom data attributes', () => {
      render(<Button data-testid='custom-button'>Button</Button>)
      expect(screen.getByTestId('custom-button')).toBeInTheDocument()
    })

    it('renders with disabled state', () => {
      render(<Button disabled>Disabled Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('renders with custom onClick handler', async () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Clickable Button</Button>)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('asChild functionality', () => {
    it('renders as Link component when asChild is true and Link is provided', () => {
      render(
        <Button asChild>
          <a href='https://example.com/test'>Link Button</a>
        </Button>
      )

      const link = screen.getByRole('link', { name: 'Link Button' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com/test')
      expect(link).toHaveAttribute('data-slot', 'button')
    })

    it('renders as anchor tag when asChild is true and anchor is provided', () => {
      render(
        <Button asChild>
          <a
            href='https://example.com'
            target='_blank'
            rel='noopener noreferrer'
          >
            External Link
          </a>
        </Button>
      )

      const link = screen.getByRole('link', { name: 'External Link' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link).toHaveAttribute('data-slot', 'button')
    })

    it('marks child as a button via data-slot when asChild is true', () => {
      render(
        <Button
          variant='secondary'
          scheme='red'
          asChild
        >
          <a href='https://example.com/test'>Styled Link</a>
        </Button>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('data-slot', 'button')
      expect(link).toHaveAttribute('data-slot', 'button')
    })
  })

  describe('Edge cases', () => {
    it('handles complex nested content', () => {
      render(
        <Button>
          <span data-testid='nested-span'>Nested</span>
          <strong>Content</strong>
        </Button>
      )

      expect(screen.getByTestId('nested-span')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })
})
