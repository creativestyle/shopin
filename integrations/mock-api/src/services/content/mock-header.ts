import type { HeaderResponse } from '@core/contracts/content/layout'

export function getMockHeader(): HeaderResponse {
  return {
    topBarMessages: [
      'This demo store showcases the SHOPin storefront accelerator. No real orders can be placed.',
    ],
  }
}
