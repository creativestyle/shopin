import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger'
import { StoreConfigService } from './store-config.service'
import { StoreConfigResponseSchema } from '@core/contracts/store-config/store-config'

@ApiTags('store-config')
@Controller('store-config')
export class StoreConfigController {
  constructor(private readonly storeConfigService: StoreConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get store configuration' })
  @ApiOkResponse({
    description: 'Store configuration retrieved successfully',
  })
  async getStoreConfig() {
    const config = await this.storeConfigService.getStoreConfig()
    return StoreConfigResponseSchema.parse(config)
  }
}
