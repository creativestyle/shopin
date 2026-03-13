import { MyCustomerUpdateAction } from '@commercetools/platform-sdk'
import { UpdateCustomerRequest } from '@core/contracts/customer/customer'

/**
 * Maps UpdateCustomerRequest fields to Commercetools action types
 */
const FIELD_TO_ACTION_MAP: Record<
  keyof UpdateCustomerRequest,
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
 */
export function mapUpdateCustomerRequestToActions(
  request: UpdateCustomerRequest
): MyCustomerUpdateAction[] {
  return (
    Object.keys(FIELD_TO_ACTION_MAP) as Array<keyof UpdateCustomerRequest>
  ).map((field) => ({
    action: FIELD_TO_ACTION_MAP[field],
    [field]: request[field],
  })) as MyCustomerUpdateAction[]
}
