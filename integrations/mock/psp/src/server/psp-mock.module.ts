import { Injectable, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PaymentService } from './services/payment.service'

/** The mock payment provider's service, as the BFF's data-source wiring reads it. */
@Injectable()
export class MockPspServiceProvider {
  constructor(private readonly paymentService: PaymentService) {}

  getServices() {
    return { paymentService: this.paymentService }
  }
}

@Module({
  imports: [ConfigModule],
  providers: [
    PaymentService,
    { provide: 'MOCK_PSP_SERVICE_PROVIDER', useClass: MockPspServiceProvider },
  ],
  exports: [PaymentService, 'MOCK_PSP_SERVICE_PROVIDER'],
})
export class MockPspModule {}
