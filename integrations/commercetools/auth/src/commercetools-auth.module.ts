import { type Provider } from '@nestjs/common'
import { port } from '@core/integration-kit'
import { clientProviders } from '@integrations/commercetools-core'
import {
  checkGrantedScopes,
  commercetoolsErrorMeaning,
} from '@integrations/commercetools-core'
import type { CommercetoolsOptions } from '@integrations/commercetools-core'
import * as services from './services'
import { CommercetoolsErrorMatcher } from './utils/commercetools-error-matcher'
import { CommercetoolsAuthServiceProviderImpl } from './commercetools-auth-service-provider'
import { CommercetoolsIdentityProvider } from './identity'

const SERVICES = Object.values(services).filter(
  (v) => typeof v === 'function'
) as Provider[]

/** What commercetools' own sign-in needs of the API client besides the shopper scopes. */
export const SIGN_IN_SCOPES = ['manage_customers'] as const

/** commercetools sign-in (identity, plus the account flows commercetools runs itself). Shares only the package-internal client. */
export default port('auth', {
  providers: [
    ...clientProviders,
    CommercetoolsErrorMatcher,
    ...SERVICES,
    CommercetoolsIdentityProvider,
    CommercetoolsAuthServiceProviderImpl,
  ],
  inject: [CommercetoolsIdentityProvider, CommercetoolsAuthServiceProviderImpl],
  useFactory: (
    identity: CommercetoolsIdentityProvider,
    flows: CommercetoolsAuthServiceProviderImpl
  ) => ({
    signIn: identity.signIn.bind(identity),
    signUp: identity.signUp.bind(identity),
    signOut: identity.signOut.bind(identity),
    refresh: identity.refresh.bind(identity),
    accountFlows: flows.getAuthServices(),
  }),
  // once at boot: sign-up creates customers and sign-in and the re-check read them with the API client
  probe: (_auth, options) =>
    checkGrantedScopes(
      options as CommercetoolsOptions,
      SIGN_IN_SCOPES,
      'commercetools sign-in creates and reads customers with the API client',
      'Create an API client with it in the Merchant Center.'
    ),
  // the BFF takes only platform failures (502–504) from it for sign-in: the session check reads the 4xx itself
  errors: commercetoolsErrorMeaning,
})
