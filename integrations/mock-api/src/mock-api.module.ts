import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MockClientModule } from './client/client.module'
import * as services from './services'
import { MockServiceProviderImpl } from './mock-service-provider'
import {
  MOCK_AUTH_SERVICES,
  MockAuthServiceProviderImpl,
} from './auth/mock-auth.services'
import { MockSessionService } from './session/mock-session.service'

@Module({
  imports: [ConfigModule, MockClientModule],
  providers: [
    ...Object.values(services),
    ...MOCK_AUTH_SERVICES,
    MockSessionService,
    {
      provide: 'MOCK_SERVICE_PROVIDER',
      useClass: MockServiceProviderImpl,
    },
    {
      provide: 'MOCK_AUTH_SERVICE_PROVIDER',
      useClass: MockAuthServiceProviderImpl,
    },
  ],
  exports: [
    MockClientModule,
    ...Object.values(services),
    'MOCK_SERVICE_PROVIDER',
    'MOCK_AUTH_SERVICE_PROVIDER',
  ],
})
export class MockApiModule {}
