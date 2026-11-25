import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { stripIgnoredCharacters } from 'graphql'
import { GraphQLClient } from 'graphql-request'
import { ContentfulGraphQLClientService } from './contentful-graphql-client.service'
import {
  GRAPHQL_CLIENT,
  CONTENTFUL_TOKENS,
  type ContentfulTokens,
} from './graphql-client.tokens'

@Module({
  imports: [ConfigModule],
  providers: [
    ContentfulGraphQLClientService,
    {
      provide: CONTENTFUL_TOKENS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): ContentfulTokens => ({
        space: configService.getOrThrow<string>('CONTENTFUL_SPACE'),
        environment: configService.getOrThrow<string>('CONTENTFUL_ENVIRONMENT'),
        accessToken: configService.getOrThrow<string>(
          'CONTENTFUL_ACCESS_TOKEN'
        ),
        previewAccessToken: configService.get<string>(
          'CONTENTFUL_PREVIEW_ACCESS_TOKEN'
        ),
      }),
    },
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
  ],
  exports: [ContentfulGraphQLClientService],
})
export class GraphQLClientModule {}
