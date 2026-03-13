import { useRef, useState } from 'react'
import { render, fireEvent } from '@testing-library/react'
import { useOutsideClick } from '../use-outside-click'

function TestComponent({ enabled = true }: { enabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [closed, setClosed] = useState(false)
  useOutsideClick(ref, () => setClosed(true), enabled)
  return (
    <div>
      <div
        ref={ref}
        data-testid='inside'
      >
        inside
      </div>
      <div data-testid='outside'>outside</div>
      <div data-testid='closed'>{closed ? 'yes' : 'no'}</div>
    </div>
  )
}

describe('useOutsideClick', () => {
  it('calls handler when clicking outside', () => {
    const { getByTestId } = render(<TestComponent />)
    fireEvent.mouseDown(getByTestId('outside'))
    expect(getByTestId('closed').textContent).toBe('yes')
  })

  it('does not call when clicking inside', () => {
    const { getByTestId } = render(<TestComponent />)
    fireEvent.mouseDown(getByTestId('inside'))
    expect(getByTestId('closed').textContent).toBe('no')
  })

  it('respects enabled=false', () => {
    const { getByTestId } = render(<TestComponent enabled={false} />)
    fireEvent.mouseDown(getByTestId('outside'))
    expect(getByTestId('closed').textContent).toBe('no')
  })
})
