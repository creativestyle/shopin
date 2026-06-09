/**
 * GlobalError is the root-level Next.js error boundary rendered when an
 * unhandled exception reaches the top of the App Router tree. It must render
 * its own <html>/<body> because the root layout.tsx is a bare fragment, so
 * RootFallbackShell is mocked here to avoid the jsdom <html>-in-<div> warning.
 * Tests verify that the component shows a user-friendly message and provides
 * a reset() escape hatch. The error digest is intentionally NOT displayed
 * (it is a server-side correlation ID with no value to end-users).
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GlobalError from '../global-error'

// RootFallbackShell renders <html><body> which is invalid inside jsdom's <div>
// container. Mock it to a plain fragment so GlobalError's own logic is testable.
jest.mock('../root-fallback-shell', () => ({
  RootFallbackShell: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

describe('GlobalError', () => {
  const mockReset = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the error heading', () => {
    render(
      <GlobalError
        error={new Error('boom')}
        reset={mockReset}
      />
    )
    expect(screen.getByRole('heading')).toHaveTextContent(
      'Something went wrong'
    )
  })

  it('does not display the error digest (server-side correlation ID, not user-facing)', () => {
    const error = Object.assign(new Error('boom'), { digest: 'abc-123' })
    render(
      <GlobalError
        error={error}
        reset={mockReset}
      />
    )
    expect(screen.queryByText(/abc-123/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Error ID/)).not.toBeInTheDocument()
  })

  it('renders a "Try again" button', () => {
    render(
      <GlobalError
        error={new Error('boom')}
        reset={mockReset}
      />
    )
    expect(
      screen.getByRole('button', { name: /try again/i })
    ).toBeInTheDocument()
  })

  it('calls reset() when the "Try again" button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <GlobalError
        error={new Error('boom')}
        reset={mockReset}
      />
    )
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(mockReset).toHaveBeenCalledTimes(1)
  })
})
