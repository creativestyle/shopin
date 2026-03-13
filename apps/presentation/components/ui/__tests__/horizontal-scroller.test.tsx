import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HorizontalScroller } from '../horizontal-scroller'

describe('HorizontalScroller', () => {
  it('shows correct button states when content is wider than container', async () => {
    // Mock the scroll container properties
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
      configurable: true,
      value: 0,
    })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      value: 100, // Content width is wider than container
    })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 50, // Container width is narrower than content
    })

    render(
      <HorizontalScroller>
        <div>Wide content</div>
      </HorizontalScroller>
    )

    // Wait for the component to update after the useEffect runs
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { hidden: true })
      expect(buttons).toHaveLength(2)
    })

    const [leftButton, rightButton] = screen.getAllByRole('button', {
      hidden: true,
    })

    expect(leftButton).toHaveAttribute('aria-hidden', 'true')
    expect(rightButton).not.toHaveAttribute('aria-hidden')
  })

  it('hides both buttons when content fits in container', async () => {
    // Mock the scroll container properties for narrow content
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
      configurable: true,
      value: 0,
    })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      value: 50, // Content width is narrower than container
    })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 100, // Container width is wider than content
    })

    render(
      <HorizontalScroller>
        <div>Narrow content</div>
      </HorizontalScroller>
    )

    // Wait for the component to update after the useEffect runs
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { hidden: true })
      expect(buttons).toHaveLength(2)
    })

    const [leftButton, rightButton] = screen.getAllByRole('button', {
      hidden: true,
    })

    expect(leftButton).toHaveAttribute('aria-hidden', 'true')
    expect(rightButton).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows only left button when scrolled to the right', async () => {
    // Mock the scroll container properties for scrolled state
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
      configurable: true,
      value: 90, // Scrolled almost to the end
    })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      value: 100, // Content width is wider than container
    })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 50, // Container width is narrower than content
    })

    render(
      <HorizontalScroller>
        <div>Wide content</div>
      </HorizontalScroller>
    )

    // Wait for the component to update after the useEffect runs
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { hidden: true })
      expect(buttons).toHaveLength(2)
    })

    const [leftButton, rightButton] = screen.getAllByRole('button', {
      hidden: true,
    })

    expect(leftButton).not.toHaveAttribute('aria-hidden')
    expect(rightButton).toHaveAttribute('aria-hidden', 'true')
  })

  it('scrolls when buttons are clicked', async () => {
    // Mock scrollTo method
    const mockScrollTo = jest.fn()

    Object.defineProperty(Element.prototype, 'scrollTo', {
      value: mockScrollTo,
      writable: true,
    })

    // Mock scroll container properties for scrolling test
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
      configurable: true,
      value: 0,
    })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      value: 100, // Content width is wider than container
    })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 50, // Container width is narrower than content
    })

    render(
      <HorizontalScroller>
        <div>Wide content</div>
      </HorizontalScroller>
    )

    // Wait for buttons to be rendered
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { hidden: true })
      expect(buttons).toHaveLength(2)
    })

    const [leftButton, rightButton] = screen.getAllByRole('button', {
      hidden: true,
    })

    fireEvent.click(rightButton)
    fireEvent.click(leftButton)

    expect(mockScrollTo).toHaveBeenCalledTimes(2)
  })
})
