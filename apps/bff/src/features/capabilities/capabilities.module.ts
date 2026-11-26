import { Module } from '@nestjs/common'
import { CapabilitiesController } from './capabilities.controller'
import { CapabilitiesService } from './capabilities.service'

@Module({
  controllers: [CapabilitiesController],
  providers: [CapabilitiesService],
})
export class CapabilitiesModule {}
