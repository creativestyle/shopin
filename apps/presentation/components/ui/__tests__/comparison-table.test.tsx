import { render, screen } from '@testing-library/react'
import React from 'react'
import {
  ComparisonTable,
  ComparisonTableBody,
  ComparisonTableRow,
  ComparisonTableCell,
} from '../comparison-table'

// Mock next-intl
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() =>
    Promise.resolve((key: string) => {
      const translations: Record<string, string> = {
        yes: 'Yes',
        no: 'No',
      }
      return translations[key] || key
    })
  ),
}))

// Mock SVG icons with different testids
jest.mock('@/components/ui/icons/check.svg', () => {
  return function CheckIcon(props: {
    'className'?: string
    'aria-hidden'?: boolean
  }) {
    return (
      <div
        data-testid='check-icon'
        {...props}
      />
    )
  }
})

jest.mock('@/components/ui/icons/cross.svg', () => {
  return function CrossIcon(props: {
    'className'?: string
    'aria-hidden'?: boolean
  }) {
    return (
      <div
        data-testid='cross-icon'
        {...props}
      />
    )
  }
})

/**
 * Helper function to resolve async components for testing
 * @param Component - The async component function
 * @param props - The props to pass to the component
 * @returns Promise that resolves to a component function
 */
async function resolvedComponent<TProps extends Record<string, unknown>>(
  Component: (props: TProps) => Promise<React.ReactElement>,
  props: TProps
): Promise<() => React.ReactElement> {
  const ComponentResolved = await Component(props)
  return () => ComponentResolved
}

describe('ComparisonTable', () => {
  describe('Placeholder replacement functionality', () => {
    it('replaces {y} placeholder with check icon', async () => {
      const ComparisonTableCellResolved = await resolvedComponent(
        ComparisonTableCell,
        {
          children: '{y}',
        }
      )

      render(
        <ComparisonTable>
          <ComparisonTableBody>
            <ComparisonTableRow>
              <ComparisonTableCellResolved />
            </ComparisonTableRow>
          </ComparisonTableBody>
        </ComparisonTable>
      )

      // Check that the placeholder is replaced with an icon (div with aria-hidden)
      const cell = screen.getByRole('cell')
      const icon = cell.querySelector('div[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('text-green-600')

      // Check that screen reader text is present
      expect(screen.getByText('Yes')).toBeInTheDocument()
    })

    it('replaces {n} placeholder with cross icon', async () => {
      const ComparisonTableCellResolved = await resolvedComponent(
        ComparisonTableCell,
        {
          children: '{n}',
        }
      )

      render(
        <ComparisonTable>
          <ComparisonTableBody>
            <ComparisonTableRow>
              <ComparisonTableCellResolved />
            </ComparisonTableRow>
          </ComparisonTableBody>
        </ComparisonTable>
      )

      // Check that the placeholder is replaced with an icon (div with aria-hidden)
      const cell = screen.getByRole('cell')
      const icon = cell.querySelector('div[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('text-red-600')

      // Check that screen reader text is present
      expect(screen.getByText('No')).toBeInTheDocument()
    })

    it('replaces multiple placeholders in single cell', async () => {
      const ComparisonTableCellResolved = await resolvedComponent(
        ComparisonTableCell,
        {
          children: 'Feature: {y}, Another: {n}',
        }
      )

      render(
        <ComparisonTable>
          <ComparisonTableBody>
            <ComparisonTableRow>
              <ComparisonTableCellResolved />
            </ComparisonTableRow>
          </ComparisonTableBody>
        </ComparisonTable>
      )

      // Check that both placeholders are replaced with icons
      const cell = screen.getByRole('cell')
      const icons = cell.querySelectorAll('div[aria-hidden="true"]')
      expect(icons).toHaveLength(2)

      // Check that we have both green and red icons
      const greenIcon = cell.querySelector(
        'div[aria-hidden="true"].text-green-600'
      )
      const redIcon = cell.querySelector('div[aria-hidden="true"].text-red-600')
      expect(greenIcon).toBeInTheDocument()
      expect(redIcon).toBeInTheDocument()
    })

    it('handles text without placeholders', async () => {
      const ComparisonTableCellResolved = await resolvedComponent(
        ComparisonTableCell,
        {
          children: 'Regular text content',
        }
      )

      render(
        <ComparisonTable>
          <ComparisonTableBody>
            <ComparisonTableRow>
              <ComparisonTableCellResolved />
            </ComparisonTableRow>
          </ComparisonTableBody>
        </ComparisonTable>
      )

      expect(screen.getByText('Regular text content')).toBeInTheDocument()
      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument()
      expect(screen.queryByTestId('cross-icon')).not.toBeInTheDocument()
    })

    it('handles non-string children without modification', async () => {
      const ComparisonTableCellResolved = await resolvedComponent(
        ComparisonTableCell,
        {
          children: <span data-testid='span-content'>Span content</span>,
        }
      )

      render(
        <ComparisonTable>
          <ComparisonTableBody>
            <ComparisonTableRow>
              <ComparisonTableCellResolved />
            </ComparisonTableRow>
          </ComparisonTableBody>
        </ComparisonTable>
      )

      expect(screen.getByTestId('span-content')).toBeInTheDocument()
      expect(screen.getByText('Span content')).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('handles multiple rows with different placeholder combinations', async () => {
      const ComparisonTableCellResolved1 = await resolvedComponent(
        ComparisonTableCell,
        {
          children: 'Feature 1: {y}',
        }
      )
      const ComparisonTableCellResolved2 = await resolvedComponent(
        ComparisonTableCell,
        {
          children: 'Feature 2: {n}',
        }
      )
      const ComparisonTableCellResolved3 = await resolvedComponent(
        ComparisonTableCell,
        {
          children: 'Feature 3: {y} and {n}',
        }
      )

      render(
        <ComparisonTable>
          <ComparisonTableBody>
            <ComparisonTableRow>
              <ComparisonTableCellResolved1 />
            </ComparisonTableRow>
            <ComparisonTableRow>
              <ComparisonTableCellResolved2 />
            </ComparisonTableRow>
            <ComparisonTableRow>
              <ComparisonTableCellResolved3 />
            </ComparisonTableRow>
          </ComparisonTableBody>
        </ComparisonTable>
      )

      // Check that we have the correct number of icons
      const allIcons = screen
        .getAllByRole('cell')
        .flatMap((cell) =>
          Array.from(cell.querySelectorAll('div[aria-hidden="true"]'))
        )
      expect(allIcons).toHaveLength(4) // 1 + 1 + 2 = 4 total icons

      // Check that we have both green and red icons
      const greenIcons = screen
        .getAllByRole('cell')
        .flatMap((cell) =>
          Array.from(
            cell.querySelectorAll('div[aria-hidden="true"].text-green-600')
          )
        )
      const redIcons = screen
        .getAllByRole('cell')
        .flatMap((cell) =>
          Array.from(
            cell.querySelectorAll('div[aria-hidden="true"].text-red-600')
          )
        )

      expect(greenIcons).toHaveLength(2) // One in Feature 1, one in Feature 3
      expect(redIcons).toHaveLength(2) // One in Feature 2, one in Feature 3
    })
  })
})
