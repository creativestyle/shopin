import { Injectable, Inject, Logger } from '@nestjs/common'
import { LANGUAGE_TOKEN } from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import { ServerClientService } from '../client/server-client.service'
import type { StoreConfigResponse } from '@core/contracts/store-config/store-config'
import { CommercetoolsStoreApiResponseSchema } from '../schemas/store-config'
import { getCtStoreKeyForLanguage } from '../config/stores'

@Injectable()
export class StoreConfigService {
  private readonly logger = new Logger(StoreConfigService.name)

  constructor(
    private readonly serverClientService: ServerClientService,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  async getStoreConfig(): Promise<StoreConfigResponse> {
    const language = this.languageProvider.getCurrentLanguage()
    const ctStoreKey = getCtStoreKeyForLanguage(language)

    const client = this.serverClientService.getClient()

    const [storeResponse, projectResponse] = await Promise.allSettled([
      client.stores().withKey({ key: ctStoreKey }).get().execute(),
      client.get().execute(),
    ])

    const shippingCountries =
      storeResponse.status === 'fulfilled'
        ? (CommercetoolsStoreApiResponseSchema.parse(
            storeResponse.value.body
          ).countries?.map((c) => c.code) ?? [])
        : []

    if (storeResponse.status === 'rejected') {
      this.logger.warn(
        { err: storeResponse.reason, ctStoreKey },
        `Failed to fetch commercetools Store "${ctStoreKey}"; returning empty countries.`
      )
    } else if (shippingCountries.length === 0) {
      this.logger.warn(
        `commercetools Store "${ctStoreKey}" has no countries configured. ` +
          `Configure shipping destinations in Merchant Center → Stores → ${ctStoreKey} → Countries.`
      )
    }

    const projectCountries =
      projectResponse.status === 'fulfilled'
        ? (projectResponse.value.body.countries ?? [])
        : []

    if (projectResponse.status === 'rejected') {
      this.logger.warn(
        { err: projectResponse.reason },
        'Failed to fetch commercetools project countries; returning empty list.'
      )
    }

    this.logger.debug(
      { ctStoreKey, language, shippingCountries, projectCountries },
      'Store resolved'
    )

    return { shippingCountries, projectCountries }
  }
}
