import type {
  AddAddressRequest,
  AddressResponse,
  UpdateAddressRequest,
} from '@core/contracts/customer/address'
import {
  AddAddressRequestSchema,
  UpdateAddressRequestSchema,
} from '@core/contracts/customer/address'
import { AddressBase } from '@core/contracts/address/address-base'
import { CustomerResponse } from '@core/contracts/customer/customer'

/**
 * Sorts addresses with default shipping/billing addresses first.
 * @param addresses - Array of addresses to sort
 * @param defaultShippingAddressId - ID of the default shipping address
 * @param defaultBillingAddressId - ID of the default billing address
 * @returns Sorted array of addresses
 */
export function sortAddresses(
  addresses: AddressResponse[],
  defaultShippingAddressId?: string,
  defaultBillingAddressId?: string
): AddressResponse[] {
  return [...addresses].sort((a, b) => {
    const aIsDefault =
      a.id === defaultShippingAddressId || a.id === defaultBillingAddressId
    const bIsDefault =
      b.id === defaultShippingAddressId || b.id === defaultBillingAddressId

    if (aIsDefault && !bIsDefault) {
      return -1
    }

    if (!aIsDefault && bIsDefault) {
      return 1
    }

    // If both are default or both are not, maintain original order
    return 0
  })
}

/**
 * Helper function to clean address data - validates and normalizes address fields
 * @param data - Address data to clean (can be AddressBase, will validate required fields using Zod)
 * @param isEditing - Whether the address is being edited
 * @returns Cleaned and validated address data
 * @throws ZodError if required fields are missing or invalid
 */
export const cleanAddressData = (
  data: AddressBase & Partial<{ id: string }>,
  isEditing: boolean
): AddAddressRequest | UpdateAddressRequest => {
  // Use Zod to validate and narrow the type
  if (isEditing) {
    if (!data.id) {
      throw new Error('Address ID is required when editing')
    }
    return UpdateAddressRequestSchema.parse({
      ...data,
      id: data.id,
    })
  } else {
    return AddAddressRequestSchema.parse(data)
  }
}

/**
 * Fields used for address comparison - single source of truth
 * Used for matching addresses in address book and comparing billing/shipping addresses
 * Only includes string fields (excludes boolean fields like isDefaultShipping, isDefaultBilling)
 */
export const ADDRESS_COMPARISON_FIELDS = [
  'salutation',
  'firstName',
  'lastName',
  'streetName',
  'streetNumber',
  'postalCode',
  'city',
  'country',
] as const satisfies readonly (keyof AddressBase)[]

/**
 * Normalizes address field values for comparison (handles empty strings and undefined)
 */
const normalizeAddressField = (value: string | undefined): string =>
  value?.trim().toLowerCase() || ''

/**
 * Checks if two addresses match by comparing key fields
 * Addresses are normalized (trimmed and lowercased) before comparison
 * @param address1 - First address to compare
 * @param address2 - Second address to compare
 * @returns true if addresses match, false otherwise
 */
export function addressesMatch(
  address1: AddressBase | undefined,
  address2: AddressBase | undefined
): boolean {
  if (!address1 || !address2) {
    return false
  }

  return ADDRESS_COMPARISON_FIELDS.every((field) => {
    const value1 = address1[field]
    const value2 = address2[field]

    // Skip boolean fields (should not happen with ADDRESS_COMPARISON_FIELDS, but type-safe)
    if (typeof value1 !== 'string' || typeof value2 !== 'string') {
      return value1 === value2
    }

    return normalizeAddressField(value1) === normalizeAddressField(value2)
  })
}

/**
 * Matches a cart billing address to a customer address by comparing key fields
 * @param cartBillingAddress - Billing address from cart
 * @param addresses - Array of customer addresses to search
 * @returns ID of the matching address, or undefined if no match found
 */
export function findMatchingAddressId(
  cartBillingAddress: AddressBase | undefined,
  addresses: AddressResponse[]
): string | undefined {
  if (!cartBillingAddress) {
    return undefined
  }

  return addresses.find((addr) => addressesMatch(addr, cartBillingAddress))?.id
}

/**
 * Generates default values for address form fields.
 * @param address - Optional address to populate form fields (for editing)
 * @param customer - Optional customer data to populate default values
 * @param defaultShippingAddressId - Optional default shipping address ID
 * @param defaultBillingAddressId - Optional default billing address ID
 * @returns Default values object for the form
 */
export function getAddressFormDefaultValues(
  address?: AddressResponse,
  customer?: CustomerResponse,
  defaultShippingAddressId?: string,
  defaultBillingAddressId?: string
): Partial<AddAddressRequest | UpdateAddressRequest> {
  // Use customer defaults only when creating a new address (no address provided)
  const useCustomerDefaults = !address

  return {
    ...(address?.id && { id: address.id }),
    salutation:
      address?.salutation ||
      (useCustomerDefaults ? customer?.salutation : undefined),
    country: address?.country || '',
    firstName:
      address?.firstName ||
      (useCustomerDefaults ? customer?.firstName : '') ||
      '',
    lastName:
      address?.lastName ||
      (useCustomerDefaults ? customer?.lastName : '') ||
      '',
    streetName: address?.streetName || '',
    streetNumber: address?.streetNumber || '',
    additionalStreetInfo: address?.additionalStreetInfo || '',
    postalCode: address?.postalCode || '',
    city: address?.city || '',
    email: address?.email || (useCustomerDefaults ? customer?.email : '') || '',
    isDefaultShipping: address?.id
      ? address.id === defaultShippingAddressId
      : false,
    isDefaultBilling: address?.id
      ? address.id === defaultBillingAddressId
      : false,
  }
}
