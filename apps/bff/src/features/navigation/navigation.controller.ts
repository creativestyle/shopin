import { Controller, Get } from '@nestjs/common'
import { NavigationService } from './navigation.service'
import { ApiTags, ApiOkResponse } from '@nestjs/swagger'
import { MainNavigationResponseSchema } from '@core/contracts/navigation/main-navigation'
import type { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'

@Controller('navigation')
@ApiTags('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get()
  @ApiOkResponse({
    description: 'Navigation data retrieved successfully',
  })
  async getNavigation(): Promise<MainNavigationResponse> {
    return MainNavigationResponseSchema.strip().parse(
      await this.navigationService.getNavigation()
    )
  }
}
