import { currentProviders } from '../../data-source/providers'
import { CapabilitiesController } from './capabilities.controller'

jest.mock('../../data-source/providers', () => ({
  currentProviders: jest.fn(),
  unavailableDelegates: {},
}))

const serving = (
  providers: Record<string, string>,
  unavailable: Record<string, string> = {}
) =>
  (currentProviders as jest.Mock).mockReturnValue({
    providers,
    unavailable,
    services: { wishlist: true },
  })

describe('CapabilitiesController', () => {
  it('without a search integration, search is the commerce provider (its own product search)', () => {
    serving({ commerce: 'mock', cms: 'mock' })
    const c = new CapabilitiesController().getCapabilities()
    expect(c.providers.search).toBe('mock')
    expect(c.unavailable.search).toBeUndefined()
    expect(c.unavailable.psp).toBe('not configured')
  })

  it('a search integration keeps its own provider; with commerce unavailable, search is too, for the same reason', () => {
    serving({ commerce: 'ct', search: 'algolia' })
    expect(
      new CapabilitiesController().getCapabilities().providers.search
    ).toBe('algolia')
    serving({}, { commerce: 'its credentials check failed' })
    const c = new CapabilitiesController().getCapabilities()
    expect(c.providers.search).toBeUndefined()
    expect(c.unavailable.search).toBe('its credentials check failed')
  })
})
