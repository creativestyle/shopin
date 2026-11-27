import { checkEndpoint, port } from '@core/integration-kit'
import { type Provider } from '@nestjs/common'
import { graphqlClientProviders } from './client/graphql-client.module'
import * as services from './services'
import { ContentfulServiceProviderImpl } from './contentful-service-provider'
import { contentfulErrorMeaning } from './errors'

const SERVICES = Object.values(services).filter(
  (v) => typeof v === 'function'
) as Provider[]

/** Token of the service provider inside the port (tests replace it with a fake). */
export const CONTENTFUL_SERVICE_PROVIDER = 'CONTENTFUL_SERVICE_PROVIDER'

/** Contentful cms port. Options (space, environment, tokens) arrive as PortOptions. */
export default port('cms', {
  providers: [
    ...graphqlClientProviders,
    ...SERVICES,
    {
      provide: CONTENTFUL_SERVICE_PROVIDER,
      useClass: ContentfulServiceProviderImpl,
    },
  ],
  inject: [CONTENTFUL_SERVICE_PROVIDER],
  useFactory: (p: ContentfulServiceProviderImpl) => p.getServices(),
  // Contentful's errors as the shopper gets them (its 4xx are the shop's setup: 502)
  errors: contentfulErrorMeaning,
  // once at boot: the space's environment answers a GraphQL query with the delivery token
  probe: (_cms, options) =>
    checkEndpoint(
      `https://graphql.contentful.com/content/v1/spaces/${options.space}/environments/${options.environment}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${options.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: '{ __typename }' }),
      },
      {
        // graphql.contentful.com is fixed: no variable sets the host
        credentials: 'CONTENTFUL_ACCESS_TOKEN',
        notFound: 'CONTENTFUL_SPACE, CONTENTFUL_ENVIRONMENT',
      }
    ),
})
