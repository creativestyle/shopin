import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toast, addToast, dismissToastById, dismissAllToasts } from '../toast'
import { toast as sonnerToast } from 'sonner'

// Mock sonner toast functions
jest.mock('sonner', () => ({
  toast: {
    custom: jest.fn(),
    dismiss: jest.fn(),
  },
}))

// Mock the Button component
interface MockButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: string
  className?: string
}

jest.mock('../button', () => ({
  Button: ({ children, onClick, ...props }: MockButtonProps) => (
    <button
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  ),
}))

describe('Toast Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Toast rendering', () => {
    it('renders with default props', () => {
      render(<Toast>Test message</Toast>)

      expect(screen.getByText('Test message')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('renders with custom id', () => {
      render(<Toast id='test-id'>Test message</Toast>)

      expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    it('renders different toast types', () => {
      const { rerender } = render(<Toast type='info'>Info message</Toast>)
      expect(screen.getByText('Info message')).toBeInTheDocument()

      rerender(<Toast type='success'>Success message</Toast>)
      expect(screen.getByText('Success message')).toBeInTheDocument()

      rerender(<Toast type='error'>Error message</Toast>)
      expect(screen.getByText('Error message')).toBeInTheDocument()

      rerender(<Toast type='warning'>Warning message</Toast>)
      expect(screen.getByText('Warning message')).toBeInTheDocument()

      rerender(<Toast type='infoLight'>Checkout info message</Toast>)
      expect(screen.getByText('Checkout info message')).toBeInTheDocument()
    })

    it('renders with critical accessibility attributes', () => {
      render(<Toast critical>Critical message</Toast>)

      const toast = screen.getByRole('alert')
      expect(toast).toHaveAttribute('aria-live', 'assertive')
      expect(toast).toHaveAttribute('aria-atomic', 'true')
    })

    it('renders with non-critical accessibility attributes', () => {
      render(<Toast>Regular message</Toast>)

      const toast = screen.getByRole('status')
      expect(toast).toHaveAttribute('aria-live', 'polite')
      expect(toast).toHaveAttribute('aria-atomic', 'true')
    })

    it('renders without icon when withIcon is false', () => {
      render(<Toast withIcon={false}>No icon message</Toast>)

      expect(screen.getByText('No icon message')).toBeInTheDocument()
      // Icon should not be present
      expect(
        screen.queryByRole('img', { hidden: true })
      ).not.toBeInTheDocument()
    })

    it('renders close button with accessible label', () => {
      render(<Toast>Message with close</Toast>)

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    it('renders without close button when withCloseButton is false', () => {
      render(<Toast withCloseButton={false}>Message without close</Toast>)

      expect(
        screen.queryByRole('button', { name: /close/i })
      ).not.toBeInTheDocument()
    })
  })

  describe('Toast functions', () => {
    it('addToast calls sonner toast.custom with correct parameters', () => {
      const mockToast = sonnerToast as jest.Mocked<typeof sonnerToast>

      addToast({
        id: 'test-id',
        type: 'success',
        duration: 5000,
        children: 'Test message',
        onDismiss: jest.fn(),
        onAutoClose: jest.fn(),
      })

      expect(mockToast.custom).toHaveBeenCalledWith(expect.any(Function), {
        id: 'test-id',
        duration: 15000,
        onDismiss: expect.any(Function),
        onAutoClose: expect.any(Function),
      })
    })

    it('addToast returns null when no children provided', () => {
      const result = addToast({
        type: 'info',
        children: null,
      })

      expect(result).toBeNull()
    })

    it('addToast uses default duration for error type', () => {
      const mockToast = sonnerToast as jest.Mocked<typeof sonnerToast>

      addToast({
        type: 'error',
        children: 'Error message',
      })

      expect(mockToast.custom).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          duration: 15000,
        })
      )
    })

    it('addToast uses default duration for non-error type', () => {
      const mockToast = sonnerToast as jest.Mocked<typeof sonnerToast>

      addToast({
        type: 'info',
        children: 'Info message',
      })

      expect(mockToast.custom).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          duration: 7000,
        })
      )
    })

    it('dismissToastById calls sonner toast.dismiss with id', () => {
      const mockToast = sonnerToast as jest.Mocked<typeof sonnerToast>

      dismissToastById('test-id')

      expect(mockToast.dismiss).toHaveBeenCalledWith('test-id')
    })

    it('dismissAllToasts calls sonner toast.dismiss without parameters', () => {
      const mockToast = sonnerToast as jest.Mocked<typeof sonnerToast>

      dismissAllToasts()

      expect(mockToast.dismiss).toHaveBeenCalledWith()
    })
  })

  describe('Close button functionality', () => {
    it('calls sonner toast.dismiss when close button is clicked', () => {
      const mockToast = sonnerToast as jest.Mocked<typeof sonnerToast>

      render(
        <Toast
          withCloseButton
          id='test-id'
        >
          Message with close
        </Toast>
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(mockToast.dismiss).toHaveBeenCalledWith('test-id')
    })
  })

  describe('Children rendering', () => {
    it('renders string children', () => {
      render(<Toast>Simple text message</Toast>)

      expect(screen.getByText('Simple text message')).toBeInTheDocument()
    })

    it('renders JSX children', () => {
      render(
        <Toast>
          <span>
            JSX message with <strong>bold text</strong>
          </span>
        </Toast>
      )

      expect(screen.getByText('JSX message with')).toBeInTheDocument()
      expect(screen.getByText('bold text')).toBeInTheDocument()
    })
  })
})
