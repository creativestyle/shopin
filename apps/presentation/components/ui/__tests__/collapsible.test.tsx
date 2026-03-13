import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '../collapsible'

describe('Collapsible', () => {
  describe('Basic rendering', () => {
    it('renders collapsible with correct data-slot attribute', () => {
      render(
        <Collapsible data-testid='collapsible'>
          <CollapsibleTrigger>Test Trigger</CollapsibleTrigger>
          <CollapsibleContent>Test Content</CollapsibleContent>
        </Collapsible>
      )

      const collapsible = screen.getByTestId('collapsible')
      expect(collapsible).toBeInTheDocument()
      expect(collapsible).toHaveAttribute('data-slot', 'collapsible')
    })

    it('forwards additional props to the root element', () => {
      render(
        <Collapsible
          data-testid='collapsible'
          data-custom='test-value'
        >
          <CollapsibleTrigger>Test Trigger</CollapsibleTrigger>
          <CollapsibleContent>Test Content</CollapsibleContent>
        </Collapsible>
      )

      const collapsible = screen.getByTestId('collapsible')
      expect(collapsible).toHaveAttribute('data-custom', 'test-value')
    })
  })
})

describe('CollapsibleTrigger', () => {
  describe('Basic rendering', () => {
    it('renders trigger with correct data-slot attribute', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger data-testid='collapsible-trigger'>
            Test Trigger
          </CollapsibleTrigger>
          <CollapsibleContent>Test Content</CollapsibleContent>
        </Collapsible>
      )

      const trigger = screen.getByTestId('collapsible-trigger')
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveAttribute('data-slot', 'collapsible-trigger')
      expect(screen.getByText('Test Trigger')).toBeInTheDocument()
    })

    it('renders as a button element', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Test Trigger</CollapsibleTrigger>
          <CollapsibleContent>Test Content</CollapsibleContent>
        </Collapsible>
      )

      const trigger = screen.getByRole('button')
      expect(trigger).toBeInTheDocument()
      expect(trigger.tagName).toBe('BUTTON')
    })
  })

  describe('Indicator functionality', () => {
    it('renders indicator by default', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Test Trigger</CollapsibleTrigger>
          <CollapsibleContent>Test Content</CollapsibleContent>
        </Collapsible>
      )

      const indicator = screen
        .getByRole('button')
        .querySelector('span[aria-hidden="true"]')
      expect(indicator).toBeInTheDocument()
    })

    it('does not render indicator when indicator prop is false', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger indicator={false}>
            Test Trigger
          </CollapsibleTrigger>
          <CollapsibleContent>Test Content</CollapsibleContent>
        </Collapsible>
      )

      const indicator = screen
        .getByRole('button')
        .querySelector('span[aria-hidden="true"]')
      expect(indicator).not.toBeInTheDocument()
    })
  })

  describe('Interaction', () => {
    it('can be clicked to toggle content', async () => {
      const user = userEvent.setup()

      render(
        <Collapsible>
          <CollapsibleTrigger>Test Trigger</CollapsibleTrigger>
          <CollapsibleContent data-testid='collapsible-content'>
            Test Content
          </CollapsibleContent>
        </Collapsible>
      )

      const trigger = screen.getByRole('button', { name: 'Test Trigger' })
      await user.click(trigger)

      // Content should be visible after clicking
      expect(screen.getByText('Test Content')).toBeInTheDocument()

      // Click to close
      await user.click(trigger)
      expect(screen.getByTestId('collapsible-content')).toHaveAttribute(
        'hidden'
      )
    })
  })
})

describe('CollapsibleContent', () => {
  describe('Basic rendering', () => {
    it('renders content with correct data-slot attribute', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Test Trigger</CollapsibleTrigger>
          <CollapsibleContent data-testid='collapsible-content'>
            Test Content
          </CollapsibleContent>
        </Collapsible>
      )

      const content = screen.getByTestId('collapsible-content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveAttribute('data-slot', 'collapsible-content')
    })

    it('renders complex nested content when opened', async () => {
      const user = userEvent.setup()

      render(
        <Collapsible>
          <CollapsibleTrigger>Test Trigger</CollapsibleTrigger>
          <CollapsibleContent>
            <div data-testid='nested-div'>
              <h3>Nested Heading</h3>
              <p>Nested paragraph</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )

      const trigger = screen.getByRole('button', { name: 'Test Trigger' })
      await user.click(trigger)

      expect(screen.getByTestId('nested-div')).toBeInTheDocument()
      expect(screen.getByText('Nested Heading')).toBeInTheDocument()
      expect(screen.getByText('Nested paragraph')).toBeInTheDocument()
    })
  })
})

describe('Collapsible integration', () => {
  it('works with multiple collapsible instances', async () => {
    const user = userEvent.setup()

    render(
      <div>
        <Collapsible data-testid='collapsible-1'>
          <CollapsibleTrigger>First Trigger</CollapsibleTrigger>
          <CollapsibleContent>First Content</CollapsibleContent>
        </Collapsible>
        <Collapsible data-testid='collapsible-2'>
          <CollapsibleTrigger>Second Trigger</CollapsibleTrigger>
          <CollapsibleContent>Second Content</CollapsibleContent>
        </Collapsible>
      </div>
    )

    // Check both collapsibles
    expect(screen.getByTestId('collapsible-1')).toBeInTheDocument()
    expect(screen.getByTestId('collapsible-2')).toBeInTheDocument()

    // Check both triggers
    expect(
      screen.getByRole('button', { name: 'First Trigger' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Second Trigger' })
    ).toBeInTheDocument()

    // Open both collapsibles to check content
    const firstTrigger = screen.getByRole('button', { name: 'First Trigger' })
    const secondTrigger = screen.getByRole('button', { name: 'Second Trigger' })

    await user.click(firstTrigger)
    await user.click(secondTrigger)

    // Check both contents
    expect(screen.getByText('First Content')).toBeInTheDocument()
    expect(screen.getByText('Second Content')).toBeInTheDocument()
  })
})
