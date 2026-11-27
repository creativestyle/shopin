import type { PortOptions } from '@core/integration-kit'

/** Env of the commercetools parts. Declared here (no Nest, no SDK), read by the BFF, handed over as options. */
export const commercetoolsClientEnv = {
  projectKey: { env: 'COMMERCETOOLS_PROJECT_KEY' },
  clientId: { env: 'COMMERCETOOLS_CLIENT_ID' },
  clientSecret: { env: 'COMMERCETOOLS_CLIENT_SECRET' },
  apiUrl: {
    env: 'COMMERCETOOLS_API_URL',
    form: 'https://api.<region>.commercetools.com',
  },
  authUrl: {
    env: 'COMMERCETOOLS_AUTH_URL',
    form: 'https://auth.<region>.commercetools.com',
  },
  storeKeys: {
    env: 'COMMERCETOOLS_STORE_KEYS',
    optional: true,
    form: '<locale>:<store key>,… (en-US:us-store,de-DE:eu-store)',
  },
} as const

export const commercetoolsCommerceEnv = {
  ...commercetoolsClientEnv,
  /** `1`: sign-in through another identity provider may create or link customers in this project. */
  linkCustomers: { env: 'COMMERCETOOLS_LINK_CUSTOMERS', optional: true },
} as const

export type CommercetoolsOptions = PortOptions.Of<
  typeof commercetoolsClientEnv
> & {
  linkCustomers?: string | undefined
}
