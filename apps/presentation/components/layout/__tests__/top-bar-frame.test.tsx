import { act, render, screen } from '@testing-library/react'
import { TopBarFrame } from '../top-bar-frame'

type FakeViewport = EventTarget & { offsetTop: number }

const originalViewport = Object.getOwnPropertyDescriptor(
  window,
  'visualViewport'
)

function stubViewport(offsetTop: number): FakeViewport {
  const viewport = Object.assign(new EventTarget(), { offsetTop })
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: viewport,
  })
  return viewport
}

function renderFrame() {
  const result = render(
    <TopBarFrame ariaLabel='Top bar'>
      <span>Message</span>
    </TopBarFrame>
  )
  return { ...result, bar: screen.getByRole('complementary') }
}

function moveViewport(viewport: FakeViewport, offsetTop: number, type: string) {
  viewport.offsetTop = offsetTop
  act(() => {
    viewport.dispatchEvent(new Event(type))
  })
}

describe('TopBarFrame', () => {
  afterEach(() => {
    if (originalViewport) {
      Object.defineProperty(window, 'visualViewport', originalViewport)
    } else {
      delete (window as { visualViewport?: unknown }).visualViewport
    }
  })

  it('translates the bar by the viewport offset on mount', () => {
    stubViewport(40)
    const { bar } = renderFrame()
    expect(bar.style.transform).toBe('translateY(40px)')
  })

  it('follows viewport scroll and resize events', () => {
    const viewport = stubViewport(0)
    const { bar } = renderFrame()
    expect(bar.style.transform).toBe('')

    moveViewport(viewport, 40, 'scroll')
    expect(bar.style.transform).toBe('translateY(40px)')

    moveViewport(viewport, 0, 'resize')
    expect(bar.style.transform).toBe('')
  })

  it('ignores negative offsets', () => {
    const viewport = stubViewport(0)
    const { bar } = renderFrame()

    moveViewport(viewport, -10, 'scroll')
    expect(bar.style.transform).toBe('')
  })

  it('resets the transform and stops listening on unmount', () => {
    const viewport = stubViewport(40)
    const { bar, unmount } = renderFrame()
    expect(bar.style.transform).toBe('translateY(40px)')

    unmount()
    expect(bar.style.transform).toBe('')

    moveViewport(viewport, 80, 'scroll')
    expect(bar.style.transform).toBe('')
  })

  it('renders without a transform when visualViewport is unavailable', () => {
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: undefined,
    })
    const { bar } = renderFrame()
    expect(bar.style.transform).toBe('')
    expect(screen.getByText('Message')).toBeInTheDocument()
  })
})
