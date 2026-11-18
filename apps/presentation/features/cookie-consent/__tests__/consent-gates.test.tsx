import { render, screen } from '@testing-library/react'
import { ConsentProvider } from '../consent-provider'
import { ConsentGate } from '../consent-gate'
import { clearConsent, writeConsent } from '../consent-cookie'
import {
  CONSENT_CATEGORIES,
  allRejected,
  type ConsentCategory,
} from '../cookie-consent-config'

function renderGate(category: ConsentCategory) {
  render(
    <ConsentProvider>
      <ConsentGate category={category}>
        <span data-testid='gated' />
      </ConsentGate>
    </ConsentProvider>
  )
}

describe.each(CONSENT_CATEGORIES)('ConsentGate (%s)', (category) => {
  beforeEach(() => {
    clearConsent()
  })

  it('renders nothing before a choice is made', () => {
    renderGate(category)

    expect(screen.queryByTestId('gated')).not.toBeInTheDocument()
  })

  it('renders nothing when its category is rejected', () => {
    const others = CONSENT_CATEGORIES.filter((c) => c !== category)
    writeConsent({
      ...allRejected(),
      ...Object.fromEntries(others.map((c) => [c, true])),
    })

    renderGate(category)

    expect(screen.queryByTestId('gated')).not.toBeInTheDocument()
  })

  it('renders its children once its category is consented', () => {
    writeConsent({ ...allRejected(), [category]: true })

    renderGate(category)

    expect(screen.getByTestId('gated')).toBeInTheDocument()
  })
})
