import { MyCustomerUpdateAction } from '@commercetools/platform-sdk'
import {
  CustomerResponse,
  UpdateCustomerRequest,
} from '@core/contracts/customer/customer'

/**
 * Maps UpdateCustomerRequest fields to Commercetools action types
 */
const FIELD_TO_ACTION_MAP: Record<
  Exclude<keyof UpdateCustomerRequest, 'email'>,
  MyCustomerUpdateAction['action']
> = {
  firstName: 'setFirstName',
  lastName: 'setLastName',
  salutation: 'setSalutation',
  dateOfBirth: 'setDateOfBirth',
} as const

/**
 * Maps UpdateCustomerRequest to Commercetools MyCustomerUpdateAction array
 * Includes all fields from the request, even if undefined (undefined values are valid)
 * The changeEmail action is only emitted when the email actually changed, because
 * Commercetools resets the email verification status on every change.
 */
export function mapUpdateCustomerRequestToActions(
  request: UpdateCustomerRequest,
  currentCustomer: CustomerResponse
): MyCustomerUpdateAction[] {
  const actions = (
    Object.keys(FIELD_TO_ACTION_MAP) as Array<keyof typeof FIELD_TO_ACTION_MAP>
  ).map((field) => ({
    action: FIELD_TO_ACTION_MAP[field],
    [field]: request[field],
  })) as MyCustomerUpdateAction[]

  if (request.email.toLowerCase() !== currentCustomer.email.toLowerCase()) {
    actions.push({ action: 'changeEmail', email: request.email })
  }

  return actions
}
