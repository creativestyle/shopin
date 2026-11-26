import { RequestContext } from '@core/integration-kit'
import { Injectable, Logger } from '@nestjs/common'
import { ServerClientService } from '@integrations/commercetools-core'
import type { StoreConfigResponse } from '@core/contracts/store-config/store-config'
import { CommercetoolsStoreApiResponseSchema } from '../schemas/store-config'
import { StoreKeyMap } from '../config/stores'

@Injectable()
export class StoreConfigService {
  private readonly logger = new Logger(StoreConfigService.name)

  constructor(
    private readonly serverClientService: ServerClientService,
    private readonly languageProvider: RequestContext,
    private readonly storeKeys: StoreKeyMap
  ) {}

  async getStoreConfig(): Promise<StoreConfigResponse> {
    const language = this.languageProvider.getCurrentLanguage()
    const ctStoreKey = this.storeKeys.forLanguage(language)

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
