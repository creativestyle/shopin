import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createAlgoliaClient, type AlgoliaClient } from '../create-algolia-client'

export const ALGOLIA_CLIENT = 'ALGOLIA_CLIENT'
export const ALGOLIA_INDEX_NAME = 'ALGOLIA_INDEX_NAME'

@Module({
  providers: [
    {
      provide: ALGOLIA_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): AlgoliaClient | null => {
        const appId = configService.get<string>('ALGOLIA_APP_ID')
        const searchApiKey = configService.get<string>('ALGOLIA_SEARCH_API_KEY')
        const indexName = configService.get<string>('ALGOLIA_INDEX_NAME')
        if (!appId || !searchApiKey || !indexName) {
          return null
        }
        const { client } = createAlgoliaClient({ appId, searchApiKey, indexName })
        return client
      },
    },
    {
      provide: ALGOLIA_INDEX_NAME,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): string | null => {
        return configService.get<string>('ALGOLIA_INDEX_NAME') ?? null
      },
    },
  ],
  exports: [ALGOLIA_CLIENT, ALGOLIA_INDEX_NAME],
})
export class AlgoliaClientModule {}
