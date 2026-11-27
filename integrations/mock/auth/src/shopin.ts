import { defineIntegration } from '@core/integration-kit'

/**
 * Mock identity provider (stand-in for Auth0). Its fixtures mark every e-mail as verified, so it may only
 * pair with mock commerce: never with a real customer base.
 */
export const mockIdentity = () =>
  defineIntegration({
    id: 'mock-identity',
    label: { en: 'Sample sign-in', de: 'Beispiel-Anmeldung' },
    description: {
      en: 'As a sample customer (alice@example.com)',
      de: 'Als Beispielkunde (alice@example.com)',
    },
    requires: {
      auth: {
        needs: { commerce: 'mock' },
        reason: {
          en: 'Sample sign-in signs in sample customers only',
          de: 'Die Beispiel-Anmeldung meldet nur Beispielkunden an',
        },
      },
    },
    ports: {
      auth: () =>
        // lazy on purpose: reading the config must not load Nest (see Integration.ports in the kit)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        (require('./identity') as typeof import('./identity')).default,
    },
  })
