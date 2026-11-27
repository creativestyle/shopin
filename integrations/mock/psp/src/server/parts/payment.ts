import { port } from '@core/integration-kit'
import { PaymentService } from '../services/payment.service'

/** Mock payment methods and payment link. */
export default port('psp', {
  providers: [PaymentService],
  inject: [PaymentService],
  useFactory: (paymentService: PaymentService) => ({ paymentService }),
})
