import { type Provider } from '@nestjs/common'
import {
  checkEndpoint,
  port,
  PortOptions,
  RequestContext,
} from '@core/integration-kit'
import { clientProviders } from '@integrations/commercetools-core'
import type { CommercetoolsOptions } from '@integrations/commercetools-core'
import { checkGrantedScopes } from '@integrations/commercetools-core'
import { OAuthTokenService } from '@integrations/commercetools-core'
import { CommercetoolsGuestSessionService } from '@integrations/commercetools-core'
import { CustomerScope } from '../shared/customer-scope.service'
import * as services from '../services'
import { CommercetoolsServiceProviderImpl } from '../commercetools-service-provider'
import { MapperHooks, type CommercetoolsMappers } from '../mapper-hooks'
import { StoreKeyMap, storeKeysFor, type StoreKeys } from '../config/stores'

const SERVICES = Object.values(services).filter(
  (v) => typeof v === 'function'
) as Provider[]

/**
 * commercetools commerce: catalog, carts, wishlist, customer account, orders, customer lookups, guest session;
 * the shop's mapper hooks run after the built-in mappers. `storeKeys`: the store per locale (checked at boot).
 */
export const commercePort = (
  mappers: CommercetoolsMappers = {},
  storeKeys?: StoreKeys
) =>
  port('commerce', {
    providers: [
      { provide: MapperHooks, useValue: mappers },
      // this instance's store per locale, checked at boot (throws naming the fix)
      {
        provide: StoreKeyMap,
        inject: [PortOptions, RequestContext],
        useFactory: (options: PortOptions, request: RequestContext) =>
          storeKeysFor(options.storeKeys, storeKeys, request.locales),
      },
      ...clientProviders,
      CustomerScope,
      ...SERVICES,
      OAuthTokenService,
      CommercetoolsGuestSessionService,
      CommercetoolsServiceProviderImpl,
    ],
    // StoreKeyMap: injected so the store keys are checked at boot even before a service reads them
    inject: [CommercetoolsServiceProviderImpl, PortOptions, StoreKeyMap],
    useFactory: (p: CommercetoolsServiceProviderImpl, options: PortOptions) => {
      const services = p.getServices()
      return {
        ...services,
        setCartFields: (cartId: string, fields: Record<string, unknown>) =>
          services.cartService.setFields(cartId, fields),
        // at sign-in through another identity provider, while the guest's anonymous token is still in the vault:
        // reading the guest cart as the customer takes it over (CustomerScope checks the guest owns it, then sets
        // the customer). Later, without that token, the cart could no longer be proven the guest's and is dropped.
        attachGuestCart: (cartId: string) =>
          services.cartService.getCart(cartId, { withInventory: false }),
        // customer lookups for sign-in through another identity provider: only when the project allows the BFF
        // to create and link customers (COMMERCETOOLS_LINK_CUSTOMERS=1); without them such a sign-in stops the boot
        ...(options.linkCustomers === '1' ? { customers: p.customers } : {}),
        guestSession: p.guestSession,
      }
    },
    // once at boot: an anonymous token request for the project proves the auth URL, the project key and the API
    // client (the same check and messages as every vendor's: host and variable)
    probe: async (_commerce, options) => {
      await checkEndpoint(
        `${String(options.authUrl).replace(/\/$/, '')}/oauth/${encodeURIComponent(String(options.projectKey))}/anonymous/token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${options.clientId}:${options.clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        },
        {
          host: 'COMMERCETOOLS_AUTH_URL',
          credentials: 'COMMERCETOOLS_CLIENT_ID, COMMERCETOOLS_CLIENT_SECRET',
          notFound: 'COMMERCETOOLS_PROJECT_KEY',
        }
      )
      if (options.linkCustomers === '1') {
        await checkProjectScopes(options as CommercetoolsOptions)
      }
    },
  })

/**
 * A customer of another identity provider has no commercetools token, so the part serves them through the project
 * API with the server client (CustomerScope): carts and orders, customers, payments, shopping lists of that customer.
 * The API client then needs these scopes; a customer of commercetools' own sign-in needs none of them.
 */
export const PROJECT_SCOPES = [
  'manage_orders',
  'manage_customers',
  'manage_payments',
  'manage_shopping_lists',
] as const

/** With customer linking on: the API client's granted scopes, checked once at boot, missing ones named. */
const checkProjectScopes = (options: CommercetoolsOptions) =>
  checkGrantedScopes(
    options,
    PROJECT_SCOPES,
    'COMMERCETOOLS_LINK_CUSTOMERS=1 serves customers of another identity provider through the project API',
    'Create an API client with them in the Merchant Center, or sign in with commercetools itself.'
  )

export default commercePort()
