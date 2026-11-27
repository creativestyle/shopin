import type { CustomerResponse } from '@core/contracts/customer/customer'
import { MyCustomerApiResponse } from '../schemas/customer'

/** commercetools customers always have a version; the service writes with it (the contract's `version` is optional). */
export function mapCustomerToResponse(
  customer: MyCustomerApiResponse
): CustomerResponse & { version: number } {
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    salutation: customer.salutation,
    dateOfBirth: customer.dateOfBirth,
    version: customer.version,
    isEmailVerified: customer.isEmailVerified,
  }
}
