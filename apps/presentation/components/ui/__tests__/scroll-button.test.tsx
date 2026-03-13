import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ScrollButton } from '../scroll-button'

describe('ScrollButton', () => {
  it('renders left button with aria label and flipped icon', () => {
    const onClick = jest.fn()
    const { container } = render(
      <ScrollButton
        side='left'
        visible={true}
        scheme='white'
        ariaLabel='Scroll left'
        onClick={onClick}
      />
    )

    const button = screen.getByRole('button', { name: 'Scroll left' })
    expect(button).toBeInTheDocument()

    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.classList.contains('-scale-100')).toBe(true)
  })

  it('renders right button with non-flipped icon', () => {
    const onClick = jest.fn()
    const { container } = render(
      <ScrollButton
        side='right'
        visible={true}
        scheme='white'
        ariaLabel='Scroll right'
        onClick={onClick}
      />
    )

    const button = screen.getByRole('button', { name: 'Scroll right' })
    expect(button).toBeInTheDocument()

    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.classList.contains('-scale-100')).toBe(false)
  })

  it('is hidden and not focusable when visible=false', () => {
    const onClick = jest.fn()
    const { container } = render(
      <ScrollButton
        side='left'
        visible={false}
        scheme='white'
        ariaLabel='Hidden left'
        onClick={onClick}
      />
    )

    const button = container.querySelector(
      'button[aria-label="Hidden left"]'
    ) as HTMLButtonElement | null
    expect(button).not.toBeNull()
    expect(button).toHaveAttribute('aria-hidden', 'true')
    expect(button).toHaveAttribute('tabIndex', '-1')
  })

  it('calls onClick when clicked and visible', async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()
    render(
      <ScrollButton
        side='right'
        visible={true}
        scheme='white'
        ariaLabel='Click me'
        onClick={onClick}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Click me' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
