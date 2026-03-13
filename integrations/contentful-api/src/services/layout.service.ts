import { Injectable } from '@nestjs/common'
import type {
  HeaderResponse,
  FooterResponse,
} from '@core/contracts/content/layout'
import { ContentfulGraphQLClientService } from '../client/contentful-graphql-client.service'
import { HeaderLayoutApiResponseSchema } from '../schemas/header'
import { FooterLayoutApiResponseSchema } from '../schemas/footer'
import {
  mapTopBarItemToHeaderResponse,
  mapFooterItemToFooterResponse,
} from '../mappers/layout'
import { LayoutHeaderQuery } from '../graphql/layout-header.query'
import { LayoutFooterQuery } from '../graphql/layout-footer.query'
import { ContentfulBaseService } from './contentful-base.service'

@Injectable()
export class LayoutService extends ContentfulBaseService {
  constructor(contentful: ContentfulGraphQLClientService) {
    super(contentful)
  }

  async getHeader(
    locale: string,
    preview = false
  ): Promise<HeaderResponse | null> {
    const data = await this.request(LayoutHeaderQuery, { locale }, preview)
    const parsed = HeaderLayoutApiResponseSchema.parse(data)
    const topBarItems = parsed?.topBarCollection?.items ?? []
    const header = topBarItems[0]
    return mapTopBarItemToHeaderResponse(header)
  }

  async getFooter(
    locale: string,
    preview = false
  ): Promise<FooterResponse | null> {
    const data = await this.request(LayoutFooterQuery, { locale }, preview)
    const parsed = FooterLayoutApiResponseSchema.parse(data)
    const footerItems = parsed?.footerCollection?.items ?? []
    const footer = footerItems[0]
    if (!footer) {
      return null
    }
    return mapFooterItemToFooterResponse(footer, this.resolveLocale(locale))
  }
}
