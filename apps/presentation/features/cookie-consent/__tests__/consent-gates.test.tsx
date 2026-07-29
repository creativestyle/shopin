import { render } from '@testing-library/react'
import { ConsentProvider } from '../consent-provider'
import { AnalyticsGate } from '../analytics-gate'
import { MarketingGate } from '../marketing-gate'
import { clearConsent, writeConsent } from '../consent-cookie'
import { emitConsentChange } from '../consent-store'
import type { ConsentCategories } from '../cookie-consent-config'

// Render next/script as a plain, queryable <script> so gating can be asserted.
jest.mock('next/script', () => ({
  __esModule: true,
  default: ({ id, children }: { id?: string; children?: string }) => (
    <script
      id={id}
      data-testid={id}
    >
      {children}
    </script>
  ),
}))

const CASES = [
  { name: 'analytics', Gate: AnalyticsGate, scriptId: 'mock-analytics' },
  { name: 'marketing', Gate: MarketingGate, scriptId: 'mock-marketing' },
] as const

function seedConsent(categories: ConsentCategories) {
  writeConsent(categories)
  emitConsentChange()
}

describe.each(CASES)('$name gate', ({ name, Gate, scriptId }) => {
  const other = name === 'analytics' ? 'marketing' : 'analytics'

  beforeEach(() => {
    clearConsent()
  })

  it('renders no script tag before a choice is made', () => {
    render(
      <ConsentProvider>
        <Gate />
      </ConsentProvider>
    )

    expect(document.getElementById(scriptId)).toBeNull()
  })

  it('renders no script tag when its category is rejected', () => {
    seedConsent({ analytics: false, marketing: false, [other]: true })

    render(
      <ConsentProvider>
        <Gate />
      </ConsentProvider>
    )

    expect(document.getElementById(scriptId)).toBeNull()
  })

  it('renders the script tag once its category is consented', () => {
    seedConsent({ analytics: false, marketing: false, [name]: true })

    render(
      <ConsentProvider>
        <Gate />
      </ConsentProvider>
    )

    expect(document.getElementById(scriptId)).toBeInTheDocument()
  })
})
