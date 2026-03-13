import type { HeaderResponse } from '@core/contracts/content/layout'

export function getMockHeader(): HeaderResponse {
  return {
    topBarMessages: [
      'Free returns',
      'Largest selection',
      'Secure payment',
      'Huge size selection',
      'Direct from manufacturer',
    ],
  }
}
