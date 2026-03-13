import { useTranslations } from 'next-intl'
import type {
  CustomerResponse,
  UpdateCustomerRequest,
} from '@core/contracts/customer/customer'
import { SALUTATION_OPTIONS } from '@config/constants'

type TranslationFunction = ReturnType<typeof useTranslations>

export const formatSalutation = (
  value: string | undefined,
  t: TranslationFunction
): string | undefined => {
  switch (value) {
    case 'Ms':
      return t('customerData.salutationOptions.Ms')
    case 'Mr':
      return t('customerData.salutationOptions.Mr')
    case 'Diverse':
      return t('customerData.salutationOptions.Diverse')
    default:
      return undefined
  }
}

/**
 * Generates default values for customer data form fields.
 * @param customer - Customer data to populate form fields
 * @returns Default values object for the form
 */
export function getCustomerDataFormDefaultValues(
  customer: CustomerResponse
): Partial<UpdateCustomerRequest> {
  return {
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    salutation: SALUTATION_OPTIONS.includes(customer.salutation as any)
      ? (customer.salutation as (typeof SALUTATION_OPTIONS)[number])
      : undefined,
    dateOfBirth: customer.dateOfBirth || '',
  }
}

/**
 * Cleans customer data by converting empty strings to undefined for optional fields.
 * @param data - Customer data to clean
 * @returns Cleaned customer data
 */
export function cleanCustomerData(
  data: UpdateCustomerRequest
): UpdateCustomerRequest {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    salutation: data.salutation || undefined,
    dateOfBirth: data.dateOfBirth || undefined,
  }
}
