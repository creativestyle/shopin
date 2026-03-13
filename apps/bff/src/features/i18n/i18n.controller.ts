import { Controller, Get } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger'
import { z } from 'zod'
import { I18nService } from './i18n.service'
import type { Translations } from '@core/i18n'
import { ZodParam } from '../../common/validation'
import { LanguageCodeSchema } from '@core/contracts/i18n/i18n'

@ApiTags('i18n')
@Controller('i18n')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Get('translations/:lang')
  @ApiOperation({ summary: 'Get translations for a specific language' })
  @ApiParam({
    name: 'lang',
    description: 'Language code (e.g., en, de)',
    example: 'en',
  })
  @ApiOkResponse({
    description: 'Translations retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Language not found' })
  async getTranslations(
    @ZodParam(LanguageCodeSchema, 'lang') lang: string
  ): Promise<Translations> {
    const translations = await this.i18nService.getTranslations(lang)
    return translations
  }

  @Get('languages')
  @ApiOperation({ summary: 'Get list of available languages' })
  @ApiOkResponse({
    description: 'Available languages retrieved successfully',
  })
  async getAvailableLanguages(): Promise<string[]> {
    return z
      .array(z.string())
      .parse(await this.i18nService.getAvailableLanguages())
  }
}
