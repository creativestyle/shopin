import { Injectable } from '@nestjs/common'
import type { CapabilitiesResponse } from '@core/contracts/capabilities/capabilities'
import { DataSourceFactory } from '../../data-source/data-source.factory'

@Injectable()
export class CapabilitiesService {
  constructor(private readonly dataSourceFactory: DataSourceFactory) {}

  getCapabilities(): CapabilitiesResponse {
    return this.dataSourceFactory.getCapabilities()
  }
}
