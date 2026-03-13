import type { CustomerResponse } from '@core/contracts/customer/customer'
import { MyCustomerApiResponse } from '../schemas/customer'

export function mapCustomerToResponse(
  customer: MyCustomerApiResponse
): CustomerResponse {
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
