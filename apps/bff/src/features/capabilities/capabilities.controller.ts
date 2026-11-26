import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger'
import { CapabilitiesResponseSchema } from '@core/contracts/capabilities/capabilities'
import { CapabilitiesService } from './capabilities.service'

@ApiTags('capabilities')
@Controller('capabilities')
export class CapabilitiesController {
  constructor(private readonly capabilitiesService: CapabilitiesService) {}

  @Get()
  @ApiOperation({
    summary: "Integration serving each category for the request's data source",
  })
  @ApiOkResponse({ description: 'Integrations per category' })
  getCapabilities() {
    return CapabilitiesResponseSchema.parse(
      this.capabilitiesService.getCapabilities()
    )
  }
}
