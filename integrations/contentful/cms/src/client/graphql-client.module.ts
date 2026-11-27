import type { Provider } from '@nestjs/common'
import { PortOptions } from '@core/integration-kit'
import type { ContentfulOptions } from '../env'
import { stripIgnoredCharacters } from 'graphql'
import { GraphQLClient } from 'graphql-request'
import { ContentfulGraphQLClientService } from './contentful-graphql-client.service'
import {
  GRAPHQL_CLIENT,
  CONTENTFUL_TOKENS,
  type ContentfulTokens,
} from './graphql-client.tokens'

/** CONTENTFUL_TOKENS comes from the part's forRoot (options the BFF read), never from the environment. */

/** The Contentful client providers; listed in the cms part's module so they see its PortOptions. */
export const graphqlClientProviders: Provider[] = [
  ContentfulGraphQLClientService,
  {
    provide: GRAPHQL_CLIENT,
    inject: [CONTENTFUL_TOKENS],
    useFactory: (tokens: ContentfulTokens) =>
      new GraphQLClient(
        `https://graphql.contentful.com/content/v1/spaces/${tokens.space}/environments/${tokens.environment}`,
        {
          requestMiddleware: (request) => {
            if (!request.body) {
              return request
            }
            const parsed = JSON.parse(request.body.toString())
            if (typeof parsed.query === 'string') {
              parsed.query = stripIgnoredCharacters(parsed.query)
            }
            return { ...request, body: JSON.stringify(parsed) }
          },
        }
      ),
  },
  {
    provide: CONTENTFUL_TOKENS,
    inject: [PortOptions],
    useFactory: (o: ContentfulOptions): ContentfulTokens => ({ ...o }),
  },
]
