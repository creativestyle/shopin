import type { HeaderResponse } from '@core/contracts/content/layout'

export function getMockHeader(): HeaderResponse {
  return {
    topBarMessages: [
      'DEMO ONLY: SHOPin Accelerator presentation. All products are fictional — no real orders, payments, or shipping.',
    ],
  }
}
