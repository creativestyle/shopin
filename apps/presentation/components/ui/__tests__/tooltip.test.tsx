import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TOOLTIP_DELAY,
} from '../tooltip'

// Mock Radix UI tooltip primitives to avoid complex portal rendering in tests
jest.mock('@radix-ui/react-tooltip', () => ({
  Provider: ({
    children,
    delayDuration,
    ...props
  }: {
    children: React.ReactNode
    delayDuration?: number
  }) => (
    <div
      data-testid='tooltip-provider'
      data-delay-duration={delayDuration}
      {...props}
    >
      {children}
    </div>
  ),
  Root: ({ children, ...props }: { children: React.ReactNode }) => (
    <div
      data-testid='tooltip-root'
      {...props}
    >
      {children}
    </div>
  ),
  Trigger: ({ children, ...props }: { children: React.ReactNode }) => (
    <button
      data-testid='tooltip-trigger'
      {...props}
    >
      {children}
    </button>
  ),
  Content: ({
    children,
    className,
    sideOffset,
    ...props
  }: {
    children: React.ReactNode
    className?: string
    sideOffset?: number
  }) => (
    <div
      data-testid='tooltip-content'
      className={className}
      data-side-offset={sideOffset}
      {...props}
    >
      {children}
    </div>
  ),
  Portal: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='tooltip-portal'>{children}</div>
  ),
  Arrow: ({ className }: { className?: string }) => (
    <div
      data-testid='tooltip-arrow'
      className={className}
    />
  ),
}))

describe('Tooltip', () => {
  describe('TooltipProvider', () => {
    it('renders with default delay duration', () => {
      render(
        <TooltipProvider>
          <div>Test content</div>
        </TooltipProvider>
      )

      const provider = screen.getByTestId('tooltip-provider')
      expect(provider).toBeInTheDocument()
      expect(provider).toHaveAttribute('data-delay-duration', '250')
      expect(provider).toHaveAttribute('data-slot', 'tooltip-provider')
    })

    it('renders with custom delay duration', () => {
      render(
        <TooltipProvider delayDuration={TOOLTIP_DELAY.slow}>
          <div>Test content</div>
        </TooltipProvider>
      )

      const provider = screen.getByTestId('tooltip-provider')
      expect(provider).toHaveAttribute('data-delay-duration', '700')
    })

    it('passes through additional props', () => {
      render(
        <TooltipProvider data-custom='test'>
          <div>Test content</div>
        </TooltipProvider>
      )

      const provider = screen.getByTestId('tooltip-provider')
      expect(provider).toHaveAttribute('data-custom', 'test')
    })
  })

  describe('Tooltip', () => {
    it('renders with TooltipProvider wrapper', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      )

      expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip-root')).toBeInTheDocument()
    })

    it('passes through additional props to root', () => {
      render(
        <Tooltip data-custom='test'>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      )

      const root = screen.getByTestId('tooltip-root')
      expect(root).toHaveAttribute('data-custom', 'test')
      expect(root).toHaveAttribute('data-slot', 'tooltip')
    })
  })

  describe('TooltipTrigger', () => {
    it('renders as a button element', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      )

      const trigger = screen.getByTestId('tooltip-trigger')
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveAttribute('data-slot', 'tooltip-trigger')
    })

    it('renders children correctly', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Custom trigger text</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      )

      expect(screen.getByText('Custom trigger text')).toBeInTheDocument()
    })

    it('passes through additional props', () => {
      render(
        <Tooltip>
          <TooltipTrigger
            data-custom='test'
            disabled
          >
            Hover me
          </TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      )

      const trigger = screen.getByTestId('tooltip-trigger')
      expect(trigger).toHaveAttribute('data-custom', 'test')
      expect(trigger).toHaveAttribute('disabled')
    })
  })

  describe('TooltipContent', () => {
    it('renders with portal wrapper', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      )

      expect(screen.getByTestId('tooltip-portal')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip-content')).toBeInTheDocument()
    })

    it('renders children correctly', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Custom tooltip text</TooltipContent>
        </Tooltip>
      )

      expect(screen.getByText('Custom tooltip text')).toBeInTheDocument()
    })

    it('renders with default sideOffset', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      )

      const content = screen.getByTestId('tooltip-content')
      expect(content).toHaveAttribute('data-side-offset', '0')
    })

    it('renders with custom sideOffset', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent sideOffset={10}>Tooltip content</TooltipContent>
        </Tooltip>
      )

      const content = screen.getByTestId('tooltip-content')
      expect(content).toHaveAttribute('data-side-offset', '10')
    })

    it('applies custom className', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent className='custom-class'>
            Tooltip content
          </TooltipContent>
        </Tooltip>
      )

      const content = screen.getByTestId('tooltip-content')
      expect(content).toHaveClass('custom-class')
    })

    it('passes through additional props', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent data-custom='test'>Tooltip content</TooltipContent>
        </Tooltip>
      )

      const content = screen.getByTestId('tooltip-content')
      expect(content).toHaveAttribute('data-custom', 'test')
      expect(content).toHaveAttribute('data-slot', 'tooltip-content')
    })

    it('renders with arrow element', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      )

      const arrow = screen.getByTestId('tooltip-arrow')
      expect(arrow).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes on trigger', () => {
      render(
        <Tooltip>
          <TooltipTrigger aria-describedby='tooltip-1'>Hover me</TooltipTrigger>
          <TooltipContent id='tooltip-1'>Tooltip content</TooltipContent>
        </Tooltip>
      )

      const trigger = screen.getByTestId('tooltip-trigger')
      expect(trigger).toHaveAttribute('aria-describedby', 'tooltip-1')
    })

    it('has proper role and attributes on content', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent
            role='tooltip'
            id='tooltip-1'
          >
            Tooltip content
          </TooltipContent>
        </Tooltip>
      )

      const content = screen.getByTestId('tooltip-content')
      expect(content).toHaveAttribute('role', 'tooltip')
      expect(content).toHaveAttribute('id', 'tooltip-1')
    })

    it('supports keyboard navigation', () => {
      render(
        <Tooltip>
          <TooltipTrigger tabIndex={0}>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      )

      const trigger = screen.getByTestId('tooltip-trigger')
      expect(trigger).toHaveAttribute('tabIndex', '0')
    })

    it('supports focus management', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      )

      const trigger = screen.getByTestId('tooltip-trigger')
      expect(trigger).toBeInTheDocument()

      // The trigger should be focusable
      trigger.focus()
      expect(trigger).toHaveFocus()
    })
  })
})
