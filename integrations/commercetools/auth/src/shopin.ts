import { defineIntegration } from '@core/integration-kit'
import { commercetoolsClientEnv } from '@integrations/commercetools-core/env'

/**
 * The sign-in (auth) part of commercetools: identity only, against the customers of the commercetools project. Same
 * id as the commerce part (`@integrations/commercetools-commerce`): one provider, whose parts the kit merges; it
 * works only with commercetools commerce. Removing it: switch auth away (`npm run use auth <key>`), delete this
 * folder, `npm run setup`.
 */
export const commercetoolsAuth = () =>
  defineIntegration({
    id: 'commercetools',
    label: 'commercetools',
    description: {
      en: 'Sign-in with the customer accounts of the commercetools project',
      de: 'Anmeldung mit den Kundenkonten des commercetools-Projekts',
    },
    requires: {
      auth: {
        needs: { commerce: 'commercetools' },
        reason: {
          en: 'commercetools sign-in uses the customers of the commercetools project',
          de: 'Die commercetools-Anmeldung nutzt die Kunden des commercetools-Projekts',
        },
      },
    },
    env: { auth: commercetoolsClientEnv },
    // lazy: the Nest module and the SDK load only when the config chooses it
    /* eslint-disable @typescript-eslint/no-require-imports */
    ports: {
      auth: () =>
        (require('./parts/auth') as typeof import('./parts/auth')).default,
    },
    /* eslint-enable @typescript-eslint/no-require-imports */
  })
