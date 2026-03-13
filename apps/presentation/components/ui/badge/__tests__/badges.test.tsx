import React from 'react'
import { render, screen } from '@testing-library/react'
import { Badges } from '../badges'
import type { BadgesProps } from '../badges'

type NonEmptyArray<T> = [T, ...T[]]

// Mock the Badge component
jest.mock('../badge', () => ({
  Badge: ({
    children,
    variant,
    size,
    ...props
  }: {
    children?: React.ReactNode
    variant?: string
    size?: string
    [key: string]: unknown
  }) => (
    <span
      data-testid='badge'
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </span>
  ),
}))

describe('Badges', () => {
  const createMockBadge = (
    overrides: Partial<BadgesProps['badges'][0]> = {}
  ): BadgesProps['badges'][0] => ({
    variant: 'green',
    text: 'Test Badge',
    ...overrides,
  })

  describe('Rendering badges', () => {
    it('renders multiple badges', () => {
      const badges: NonEmptyArray<BadgesProps['badges'][0]> = [
        createMockBadge({ text: 'New', variant: 'green' }),
        createMockBadge({ text: 'Sale', variant: 'orange' }),
        createMockBadge({ text: 'Limited', variant: 'yellow' }),
      ]

      render(<Badges badges={badges} />)

      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('Sale')).toBeInTheDocument()
      expect(screen.getByText('Limited')).toBeInTheDocument()
      expect(screen.getAllByTestId('badge')).toHaveLength(3)
    })
  })

  describe('Key prop handling', () => {
    it('uses variant as key for badges', () => {
      const badges: NonEmptyArray<BadgesProps['badges'][0]> = [
        createMockBadge({ text: 'Badge 1', variant: 'green' }),
        createMockBadge({ text: 'Badge 2', variant: 'orange' }),
      ]

      render(<Badges badges={badges} />)

      // The key is used internally by React, we can verify the badges are rendered
      expect(screen.getByText('Badge 1')).toBeInTheDocument()
      expect(screen.getByText('Badge 2')).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('filters out badges with empty text while keeping valid ones', () => {
      const badges: NonEmptyArray<BadgesProps['badges'][0]> = [
        createMockBadge({ text: 'Valid Badge', variant: 'green' }),
        createMockBadge({ text: '', variant: 'orange' }),
        createMockBadge({ text: 'Another Valid', variant: 'yellow' }),
      ]

      render(<Badges badges={badges} />)

      // Only badges with non-empty text should be rendered
      expect(screen.getByText('Valid Badge')).toBeInTheDocument()
      expect(screen.getByText('Another Valid')).toBeInTheDocument()
      expect(screen.getAllByTestId('badge')).toHaveLength(2)
    })
  })
})
