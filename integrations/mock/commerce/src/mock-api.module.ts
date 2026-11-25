import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MockClientModule } from './client/client.module'
import * as services from './services'
import { MockServiceProviderImpl } from './mock-service-provider'

@Module({
  imports: [ConfigModule, MockClientModule],
  providers: [
    ...Object.values(services),
    {
      provide: 'MOCK_SERVICE_PROVIDER',
      useClass: MockServiceProviderImpl,
    },
  ],
  exports: [
    MockClientModule,
    ...Object.values(services),
    'MOCK_SERVICE_PROVIDER',
  ],
})
export class MockApiModule {}
