import { Controller, Get, Module } from '@nestjs/common'
import { Reads } from '@core/integration-kit'
import { current, viewNow } from './state'

/** The /setup page's data: the switch's view (labels, requirements, providers that cannot serve) and this request's choice. */
@Reads()
@Controller('switch')
class SwitchController {
  @Get()
  get() {
    return { providers: viewNow(), selected: current().providers }
  }
}

/** The switch's BFF route (`GET /bff/switch`): add it to `features` next to the switch. */
@Module({ controllers: [SwitchController] })
export class SwitchModule {}
