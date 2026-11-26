import { defineIntegration } from '@core/integration-kit'

/**
 * Mock payment provider: sample payment methods and a payment link to its demo payment page, which is this
 * package's `./page` (a storefront slot; setup wires it). A part of mock data (id `mock`, with `mock/commerce` and
 * `mock/cms`). No money moves.
 */
export const mockPsp = () =>
  defineIntegration({
    id: 'mock',
    label: {
      en: 'Sample data: generated, works without any account',
      de: 'Beispieldaten: erzeugt, ohne Konto nutzbar',
    },
    storefront: {
      // its payment link opens the storefront's payment step (PAYMENT_STEP_PATH): this package's payment page
      slots: {
        psp: { PaymentStep: '@integrations/mock-psp/page#PaymentDemo' },
      },
    },
    /* eslint-disable @typescript-eslint/no-require-imports */
    ports: {
      // lazy on purpose: reading the config must not load Nest (see Integration.ports in the kit)
      psp: () =>
        (
          require('./server/parts/payment') as typeof import('./server/parts/payment')
        ).default,
    },
    /* eslint-enable @typescript-eslint/no-require-imports */
  })
