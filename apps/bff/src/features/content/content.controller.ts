import { Controller, Get, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import { ContentService } from './content.service'
import { DraftModeService } from './draft-mode.service'
import { ApiTags, ApiOkResponse, ApiNotFoundResponse } from '@nestjs/swagger'
import {
  ContentPageResponse,
  ContentPageResponseSchema,
  ContentSlugSchema,
} from '@core/contracts/content/page'
import {
  FooterResponseSchema,
  HeaderResponseSchema,
} from '@core/contracts/content/layout'
import { ZodParam } from '../../common/validation'

@Controller('content')
@ApiTags('content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly draftMode: DraftModeService
  ) {}

  @Get('page/:slug')
  @ApiOkResponse({
    description: 'Content page data retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'Page not found',
  })
  async getContentPage(
    @ZodParam(ContentSlugSchema, 'slug') slugParam: string,
    @Req() req?: Request,
    @Res({ passthrough: true }) res?: Response
  ): Promise<ContentPageResponse> {
    const usePreview = req ? this.draftMode.isDraftModeRequest(req) : false
    this.draftMode.applyNoCacheIfPreview(res, usePreview)
    const slug = decodeURIComponent(slugParam)
    return ContentPageResponseSchema.strip().parse(
      await this.contentService.getContentPage(slug, usePreview)
    )
  }

  @Get('header')
  @ApiOkResponse({ description: 'Header (top bar + main nav) from Contentful' })
  async getHeader(
    @Req() req?: Request,
    @Res({ passthrough: true }) res?: Response
  ) {
    const usePreview = req ? this.draftMode.isDraftModeRequest(req) : false
    this.draftMode.applyNoCacheIfPreview(res, usePreview)
    const data = await this.contentService.getHeader(usePreview)
    if (!data) {
      return { topBarMessages: [] }
    }
    return HeaderResponseSchema.strip().parse(data)
  }

  @Get('footer')
  @ApiOkResponse({
    description: 'Footer sections and legal links from Contentful',
  })
  async getFooter(
    @Req() req?: Request,
    @Res({ passthrough: true }) res?: Response
  ) {
    const usePreview = req ? this.draftMode.isDraftModeRequest(req) : false
    this.draftMode.applyNoCacheIfPreview(res, usePreview)
    const data = await this.contentService.getFooter(usePreview)
    if (!data) {
      return { sections: [], legalLinks: [] }
    }
    return FooterResponseSchema.strip().parse(data)
  }
}
