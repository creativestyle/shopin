import { RequestContext } from '@core/integration-kit'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { COMMERCETOOLS_CLIENT, Client } from '@integrations/commercetools-core'
import { StoreKeyMap } from '../config/stores'
import { CommercetoolsStoreApiResponseSchema } from '../schemas/store-config'

/** The port value's key for its StoreChannels: the start-up check (the port's probe) reads the stores through it. */
export const STORE_CHANNELS = Symbol('commercetools store channels')

/**
 * The distribution channel of each store `storeKeys` configures, read from that store (it is not configured a second
 * time). Every store is read once, at start, by the port's start-up check (`load`); a store that cannot be read fails
 * that check, so the category is unavailable instead of serving prices that could differ between pages and cart.
 * Prices are selected by the channel; stock is not (it stays summed over all supply channels).
 */
@Injectable()
export class StoreChannels {
  private readonly logger = new Logger(StoreChannels.name)
  private byStore?: ReadonlyMap<string, string | undefined>

  constructor(
    @Inject(COMMERCETOOLS_CLIENT) private readonly client: Client,
    private readonly languageProvider: RequestContext,
    private readonly storeKeys: StoreKeyMap
  ) {}

  /** Reads every configured store's distribution channel; throws naming a store that cannot be read. */
  async load(): Promise<void> {
    const channels = await Promise.all(
      this.storeKeys
        .stores()
        .map(async (key) => [key, await this.read(key)] as const)
    )
    this.byStore = new Map(channels)
  }

  /** The id of the current store's distribution channel; undefined when the store has none. */
  priceChannel(): string | undefined {
    if (!this.byStore) {
      throw new Error(
        "commercetools: the stores' distribution channels are read by the start-up check, which has not run"
      )
    }
    return this.byStore.get(
      this.storeKeys.forLanguage(this.languageProvider.getCurrentLanguage())
    )
  }

  private async read(key: string): Promise<string | undefined> {
    let body: unknown
    try {
      body = (await this.client.stores().withKey({ key }).get().execute()).body
    } catch (error) {
      const e = error as { statusCode?: number; message?: string }
      throw new Error(
        `commercetools Store "${key}" cannot be read (commercetools({ storeKeys }) or COMMERCETOOLS_STORE_KEYS): ${e.statusCode ? `HTTP ${e.statusCode}` : (e.message ?? String(error))}`
      )
    }
    const [first, ...others] =
      CommercetoolsStoreApiResponseSchema.parse(body).distributionChannels ?? []
    if (first && others.length > 0) {
      this.logger.warn(
        `commercetools Store "${key}" has ${others.length + 1} distribution channels; prices are selected by the first, ${first.id}.`
      )
    }
    return first?.id
  }
}
