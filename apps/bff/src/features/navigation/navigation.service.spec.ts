import { NavigationService } from './navigation.service'
import type { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'

// Minimal shape for DataSourceFactory used by service
type NavigationPort = { getNavigation: () => Promise<MainNavigationResponse> }

type Services = {
  navigationService: NavigationPort
  productService: unknown
  productCollectionService: unknown
}
class MockDataSourceFactory {
  getServices = jest.fn<Services, []>()
}

describe('NavigationService', () => {
  let service: NavigationService
  let dataSourceFactory: MockDataSourceFactory

  beforeEach(() => {
    dataSourceFactory = new MockDataSourceFactory()
    service = new NavigationService(dataSourceFactory as unknown as never)
  })

  describe('getNavigation', () => {
    it('returns data from the selected data source navigationService', async () => {
      const mockNavigationData: MainNavigationResponse = {
        items: [
          { text: 'Category 1', href: '/cat1' },
          { text: 'Category 2', href: '/cat2' },
        ],
      }

      const getNavigation = jest.fn().mockResolvedValue(mockNavigationData)
      dataSourceFactory.getServices.mockReturnValue({
        navigationService: { getNavigation },
        productService: {},
        productCollectionService: {},
      })

      const result = await service.getNavigation()

      expect(getNavigation).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual(mockNavigationData)
    })

    it('propagates errors from underlying service', async () => {
      const errorMessage = 'API Error'
      const getNavigation = jest.fn().mockRejectedValue(new Error(errorMessage))
      dataSourceFactory.getServices.mockReturnValue({
        navigationService: { getNavigation },
        productService: {},
        productCollectionService: {},
      })

      await expect(service.getNavigation()).rejects.toThrow(errorMessage)
    })
  })
})
