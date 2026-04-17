import { Injectable, Inject } from '@nestjs/common'
import { COMMERCETOOLS_CLIENT, Client } from '../client/client.module'
import {
  mapFilterableAttributes,
  type FilterableAttribute,
} from '../mappers/product-collection'
import { PRODUCT_TYPES_FETCH_LIMIT } from '@config/constants'

@Injectable()
export class FilterableAttributesCacheService {
  private cache: FilterableAttribute[] | null = null

  constructor(@Inject(COMMERCETOOLS_CLIENT) private readonly client: Client) {}

  async getFilterableAttributes(): Promise<FilterableAttribute[]> {
    if (this.cache) {
      return this.cache
    }

    const response = await this.client
      .productTypes()
      .get({ queryArgs: { limit: PRODUCT_TYPES_FETCH_LIMIT } })
      .execute()

    this.cache = mapFilterableAttributes(response.body.results)
    return this.cache
  }
}
