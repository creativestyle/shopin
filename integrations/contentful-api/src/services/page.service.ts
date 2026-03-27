import { Injectable, NotFoundException } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { ClientError } from 'graphql-request'
import type { ContentPageResponse } from '@core/contracts/content/page'
import type { TeaserResponse } from '@core/contracts/content/teaser'
import { ContentfulGraphQLClientService } from '../client/contentful-graphql-client.service'
import {
  PageCollectionApiResponseSchema,
  TeaserEntryApiResponseSchema,
} from '../schemas'
import {
  collectAssetIdsFromPageResponse,
  injectResolvedAssetsIntoPageResponse,
} from '../helpers/page-asset-resolution'
import { mapTeaserEntryToResponse } from '../mappers/teaser'
import { mapPageItemToContentPageResponse } from '../mappers/page'
import { PageBySlugQuery } from '../graphql/page-by-slug.query'
import { AssetsByIdQuery } from '../graphql/assets-by-id.query'
import type { AssetItem } from '../schemas'
import { ContentfulBaseService } from './contentful-base.service'

@Injectable()
export class PageService extends ContentfulBaseService {
  constructor(
    contentful: ContentfulGraphQLClientService,
    private readonly logger: PinoLogger
  ) {
    super(contentful)
    this.logger.setContext(PageService.name)
  }

  /**
   * Fetches a page by slug and locale from Contentful.
   * Each teaser is a separate content model (TeaserBanner, TeaserHeadline, etc.).
   * Rich text embedded assets are resolved in a separate low-complexity query to stay under the 11000 limit.
   */
  async getPage(
    slug: string,
    locale: string,
    preview = false
  ): Promise<ContentPageResponse> {
    const localeOrDefault = this.resolveLocale(locale)
    let data: unknown
    try {
      data = await this.request(PageBySlugQuery, { slug, locale }, preview)
    } catch (err) {
      if (
        err instanceof ClientError &&
        err.message.includes('Unknown type "Teaser')
      ) {
        throw new Error(
          `Contentful GraphQL schema is missing teaser content types (e.g. TeaserBanner, TeaserHero). ` +
            `Create them by running migrations in the Contentful space used by this app: ` +
            `\`cd integrations/contentful-migration && npm run migrate\`. ` +
            `Ensure CONTENTFUL_SPACE and CONTENTFUL_ENVIRONMENT match the space you migrate. Original error: ${err.message}`
        )
      }
      throw err
    }

    const parsed = PageCollectionApiResponseSchema.parse(data)
    const pageItems = parsed?.pageCollection?.items ?? []
    const page = pageItems[0]

    if (!page) {
      throw new NotFoundException('Page not found')
    }

    await this.resolveAssetsInPageData(data, localeOrDefault, preview)
    const parsedWithAssets = PageCollectionApiResponseSchema.parse(data)
    const pageWithAssets = parsedWithAssets?.pageCollection?.items?.[0] ?? page

    const components: TeaserResponse[] = (
      pageWithAssets.componentsCollection?.items ?? []
    ).flatMap((entry: unknown): TeaserResponse[] => {
      // Validate each teaser independently so one bad entry does not break the whole page.
      const parsedTeaser = TeaserEntryApiResponseSchema.safeParse(entry)

      if (!parsedTeaser.success) {
        // Try to extract __typename for observability; if missing/malformed log as "unknown".
        let teaserType = 'unknown'
        if (typeof entry === 'object' && entry !== null) {
          const maybeType = (entry as { __typename?: unknown }).__typename
          if (typeof maybeType === 'string') {
            teaserType = maybeType
          }
        }

        this.logger.warn(
          { teaserType, issues: parsedTeaser.error.issues },
          'Skipping unsupported or invalid teaser entry from Contentful'
        )
        return []
      }

      const mappedTeaser = mapTeaserEntryToResponse(parsedTeaser.data)
      return mappedTeaser == null ? [] : [mappedTeaser]
    })

    return mapPageItemToContentPageResponse(pageWithAssets, components)
  }

  /**
   * Fetches assets by IDs from the raw page response and injects them into the
   * rich text links so mappers can resolve embedded-asset-block and asset-hyperlink nodes.
   * Non-fatal on failure: rich text will show placeholders for unresolved assets.
   */
  private async resolveAssetsInPageData(
    data: unknown,
    locale: string,
    preview: boolean
  ): Promise<void> {
    const assetIds = collectAssetIdsFromPageResponse(data)
    if (assetIds.length === 0) {
      return
    }
    try {
      const assetsResponse = await this.request<{
        assetCollection?: { items?: AssetItem[] }
      }>(
        AssetsByIdQuery,
        { ids: assetIds, limit: assetIds.length, locale },
        preview
      )
      const assets = assetsResponse?.assetCollection?.items ?? []
      if (assets.length > 0) {
        injectResolvedAssetsIntoPageResponse(data, assets)
      }
    } catch (err) {
      this.logger.warn(
        { err },
        'Failed to resolve rich text assets (non-fatal, placeholders will be used)'
      )
    }
  }
}
