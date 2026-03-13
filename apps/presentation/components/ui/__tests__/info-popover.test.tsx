import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  InfoPopover,
  InfoPopoverTrigger,
  InfoPopoverContent,
} from '../info-popover'

// Mock the useMediaQuery hook
jest.mock('../../../hooks/use-media-query', () => ({
  useFinePointer: jest.fn(),
  useMediaQuery: jest.fn(),
}))

// Mock the Tooltip and Drawer components
jest.mock('../tooltip', () => ({
  Tooltip: ({ children, onOpenChange, ...props }: any) => (
    <div
      data-testid='tooltip'
      data-on-open-change={onOpenChange?.toString()}
      {...props}
    >
      {children}
    </div>
  ),
  TooltipTrigger: ({
    children,
    className,
    disabled,
    asChild,
    ...props
  }: any) => {
    if (asChild) {
      return React.cloneElement(children, { className, disabled, ...props })
    }
    return (
      <button
        data-testid='tooltip-trigger'
        className={className}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  },
  TooltipContent: ({
    children,
    className,
    side,
    sideOffset,
    withArrow,
    ...props
  }: any) => (
    <div
      data-testid='tooltip-content'
      className={className}
      data-side={side}
      data-side-offset={sideOffset}
      data-with-arrow={withArrow}
      {...props}
    >
      {children}
    </div>
  ),
}))

jest.mock('../drawer', () => ({
  Drawer: ({ children, onOpenChange, ...props }: any) => (
    <div
      data-testid='drawer'
      data-on-open-change={onOpenChange?.toString()}
      {...props}
    >
      {children}
    </div>
  ),
  DrawerTrigger: ({
    children,
    className,
    disabled,
    asChild,
    ...props
  }: any) => {
    if (asChild) {
      return React.cloneElement(children, { className, disabled, ...props })
    }
    return (
      <button
        data-testid='drawer-trigger'
        className={className}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  },
  DrawerContent: ({
    children,
    scheme,
    showCloseButton,
    className,
    ...props
  }: any) => (
    <div
      data-testid='drawer-content'
      data-scheme={scheme}
      data-show-close-button={showCloseButton}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  DrawerHeader: ({ children, className, ...props }: any) => (
    <div
      data-testid='drawer-header'
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  DrawerTitle: ({ children, className, ...props }: any) => (
    <div
      data-testid='drawer-title'
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  DrawerDescription: ({ children, className, ...props }: any) => (
    <div
      data-testid='drawer-description'
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
}))

jest.mock('../visually-hidden', () => ({
  VisuallyHidden: ({ children, ...props }: any) => (
    <div
      data-testid='visually-hidden'
      {...props}
    >
      {children}
    </div>
  ),
}))

import { useFinePointer } from '../../../hooks/use-media-query'

const mockUseFinePointer = useFinePointer as jest.MockedFunction<
  typeof useFinePointer
>

describe('InfoPopover', () => {
  const defaultContent = <div>Content to display</div>
  const defaultTrigger = <span>Trigger Button</span>
  const defaultTitle = 'Test Title'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when device has fine pointer (mouse/trackpad)', () => {
    beforeEach(() => {
      mockUseFinePointer.mockReturnValue(true)
    })

    it('renders Tooltip component with context', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip-content')).toBeInTheDocument()
      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument()
    })

    it('renders trigger children correctly', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      expect(screen.getByText('Trigger Button')).toBeInTheDocument()
      expect(screen.getByText('Content to display')).toBeInTheDocument()
    })

    it('renders content correctly', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      expect(screen.getByText('Content to display')).toBeInTheDocument()
    })

    it('applies custom className to trigger', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger className='custom-class'>
            {defaultTrigger}
          </InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const trigger = screen.getByTestId('tooltip-trigger')
      expect(trigger).toHaveClass('custom-class')
    })

    it('supports asChild prop', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger asChild>
            <button data-testid='custom-button'>Custom Button</button>
          </InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      // The custom button should be rendered instead of the default trigger
      expect(screen.getByTestId('custom-button')).toBeInTheDocument()
      expect(screen.queryByTestId('tooltip-trigger')).not.toBeInTheDocument()
    })

    it('passes tooltip-specific props correctly', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent
            title={defaultTitle}
            side='right'
            withArrow={false}
            sideOffset={8}
          >
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const content = screen.getByTestId('tooltip-content')
      expect(content).toHaveAttribute('data-side', 'right')
      expect(content).toHaveAttribute('data-side-offset', '8')
      expect(content).toHaveAttribute('data-with-arrow', 'false')
    })

    it('handles disabled state from context', () => {
      render(
        <InfoPopover disabled>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const trigger = screen.getByTestId('tooltip-trigger')
      expect(trigger).toBeDisabled()
    })

    it('handles disabled state from trigger prop', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger disabled>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const trigger = screen.getByTestId('tooltip-trigger')
      expect(trigger).toBeDisabled()
    })

    it('handles disabled state from both context and trigger prop', () => {
      render(
        <InfoPopover disabled>
          <InfoPopoverTrigger disabled>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const trigger = screen.getByTestId('tooltip-trigger')
      expect(trigger).toBeDisabled()
    })

    it('passes onOpenChange callback', () => {
      const onOpenChange = jest.fn()
      render(
        <InfoPopover onOpenChange={onOpenChange}>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const tooltip = screen.getByTestId('tooltip')
      expect(tooltip).toHaveAttribute(
        'data-on-open-change',
        onOpenChange.toString()
      )
    })
  })

  describe('when device has coarse pointer (touch)', () => {
    beforeEach(() => {
      mockUseFinePointer.mockReturnValue(false)
    })

    it('renders Drawer component with context', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      expect(screen.getByTestId('drawer')).toBeInTheDocument()
      expect(screen.getByTestId('drawer-trigger')).toBeInTheDocument()
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument()
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
    })

    it('renders trigger children correctly', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      expect(screen.getByText('Trigger Button')).toBeInTheDocument()
      expect(screen.getByText('Content to display')).toBeInTheDocument()
    })

    it('renders content correctly', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      expect(screen.getByText('Content to display')).toBeInTheDocument()
    })

    it('applies custom className to trigger', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger className='custom-class'>
            {defaultTrigger}
          </InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const trigger = screen.getByTestId('drawer-trigger')
      expect(trigger).toHaveClass('custom-class')
    })

    it('supports asChild prop', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger asChild>
            <button data-testid='custom-button'>Custom Button</button>
          </InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      // The custom button should be rendered instead of the default trigger
      expect(screen.getByTestId('custom-button')).toBeInTheDocument()
      expect(screen.queryByTestId('drawer-trigger')).not.toBeInTheDocument()
    })

    it('passes drawer-specific props correctly', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent
            title={defaultTitle}
            scheme='gray'
            showCloseButton={false}
          >
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const content = screen.getByTestId('drawer-content')
      expect(content).toHaveAttribute('data-scheme', 'gray')
      expect(content).toHaveAttribute('data-show-close-button', 'false')
    })

    it('handles disabled state from context', () => {
      render(
        <InfoPopover disabled>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const trigger = screen.getByTestId('drawer-trigger')
      expect(trigger).toBeDisabled()
    })

    it('handles disabled state from trigger prop', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger disabled>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const trigger = screen.getByTestId('drawer-trigger')
      expect(trigger).toBeDisabled()
    })

    it('handles disabled state from both context and trigger prop', () => {
      render(
        <InfoPopover disabled>
          <InfoPopoverTrigger disabled>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const trigger = screen.getByTestId('drawer-trigger')
      expect(trigger).toBeDisabled()
    })

    it('passes onOpenChange callback', () => {
      const onOpenChange = jest.fn()
      render(
        <InfoPopover onOpenChange={onOpenChange}>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const drawer = screen.getByTestId('drawer')
      expect(drawer).toHaveAttribute(
        'data-on-open-change',
        onOpenChange.toString()
      )
    })
  })

  describe('default props', () => {
    it('uses default tooltip props', () => {
      mockUseFinePointer.mockReturnValue(true)
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const content = screen.getByTestId('tooltip-content')
      expect(content).toHaveAttribute('data-side', 'top')
      expect(content).toHaveAttribute('data-side-offset', '0')
      expect(content).toHaveAttribute('data-with-arrow', 'true')
    })

    it('uses default drawer props', () => {
      mockUseFinePointer.mockReturnValue(false)
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const content = screen.getByTestId('drawer-content')
      expect(content).toHaveAttribute('data-scheme', 'white')
      expect(content).toHaveAttribute('data-show-close-button', 'true')
    })
  })

  describe('error handling', () => {
    it('throws error when InfoPopoverTrigger is used outside InfoPopover', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      expect(() => {
        render(<InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>)
      }).toThrow('InfoPopoverTrigger must be used within InfoPopover')

      consoleSpy.mockRestore()
    })

    it('throws error when InfoPopoverContent is used outside InfoPopover', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      expect(() => {
        render(
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        )
      }).toThrow('InfoPopoverContent must be used within InfoPopover')

      consoleSpy.mockRestore()
    })
  })

  describe('InfoPopoverContent with title prop', () => {
    beforeEach(() => {
      mockUseFinePointer.mockReturnValue(false) // Use coarse pointer for drawer tests
    })

    it('renders DrawerContent with title when device has coarse pointer', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title='Test Title'>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      expect(screen.getByTestId('drawer')).toBeInTheDocument()
      expect(screen.getByTestId('drawer-trigger')).toBeInTheDocument()
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument()
      expect(screen.getByTestId('drawer-header')).toBeInTheDocument()
      expect(screen.getByTestId('drawer-title')).toBeInTheDocument()
      expect(screen.getByTestId('drawer-title')).toHaveTextContent('Test Title')
    })

    it('renders TooltipContent when device has fine pointer', () => {
      mockUseFinePointer.mockReturnValue(true)
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title='Test Title'>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip-content')).toBeInTheDocument()
      expect(screen.queryByTestId('drawer-header')).not.toBeInTheDocument()
      expect(screen.queryByTestId('drawer-title')).not.toBeInTheDocument()
    })

    it('renders children wrapped in DrawerDescription', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title='Test Title'>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      expect(screen.getByTestId('drawer-description')).toBeInTheDocument()
      expect(screen.getByTestId('drawer-description')).toHaveTextContent(
        'Content to display'
      )
    })

    it('renders title in DrawerTitle', () => {
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title='Test Title'>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      expect(screen.getByTestId('drawer-title')).toBeInTheDocument()
      expect(screen.getByTestId('drawer-title')).toHaveTextContent('Test Title')
    })
  })

  describe('accessibility', () => {
    it('maintains proper button semantics for triggers', () => {
      mockUseFinePointer.mockReturnValue(true)
      render(
        <InfoPopover>
          <InfoPopoverTrigger>{defaultTrigger}</InfoPopoverTrigger>
          <InfoPopoverContent title={defaultTitle}>
            {defaultContent}
          </InfoPopoverContent>
        </InfoPopover>
      )

      const trigger = screen.getByRole('button')
      expect(trigger).toBeInTheDocument()
    })
  })
})
