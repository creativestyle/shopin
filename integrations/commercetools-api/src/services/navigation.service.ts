import { Injectable, Inject } from '@nestjs/common'
import { COMMERCETOOLS_CLIENT, Client } from '../client/client.module'
import { LANGUAGE_TOKEN, LanguageTagUtils } from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import type { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import { I18N_CONFIG } from '@config/constants'
import { CategoryPagedQueryApiResponseSchema } from '../schemas/category'
import { buildCategoryTree, mapCategoryToLink } from '../mappers/navigation'

@Injectable()
export class NavigationService {
  constructor(
    @Inject(COMMERCETOOLS_CLIENT) private readonly client: Client,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  async getNavigation(): Promise<MainNavigationResponse> {
    const currentLanguage = this.languageProvider.getCurrentLanguage()
    // Commercetools uses underscores for query parameters (en_US) but hyphens for data keys (en-US)
    const queryLocale = LanguageTagUtils.toUnderscoreKey(currentLanguage)
    const dataLocale = currentLanguage
    const fallbackLocale = I18N_CONFIG.fallbackLanguage

    // Fetch all categories (including children) - up to 500 for navigation
    const response = await this.client
      .categories()
      .get({
        queryArgs: {
          limit: 500,
          locale: queryLocale,
        },
      })
      .execute()

    const responseBody = CategoryPagedQueryApiResponseSchema.parse(
      response.body
    )
    const allCategories = responseBody.results

    // Build a tree structure from flat categories
    const categoryTree = buildCategoryTree(
      allCategories,
      dataLocale,
      fallbackLocale
    )

    // Map tree to navigation response format
    return {
      items: categoryTree.map((category) => mapCategoryToLink(category)),
    }
  }
}
