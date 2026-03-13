'use client'

import { useTranslations } from 'next-intl'
import { AddressBase } from '@core/contracts/address/address-base'

/**
 * Hook that formats an address into display lines.
 * Matches the pattern used in customer-address-item.tsx
 * @param address - Address to format (AddressBase type works for both AddressResponse and BillingAddressResponse)
 * @returns Array of address lines for display
 */
export function useFormatAddressLines(
  address: AddressBase | undefined
): string[] {
  const t = useTranslations()
  // Use flexible translator for dynamic keys and cross-namespace access
  const translate = t as (key: string) => string

  if (!address) {
    return []
  }

  // Format salutation
  let salutationLabel: string | undefined
  if (address.salutation) {
    switch (address.salutation) {
      case 'Ms':
        salutationLabel = translate(
          'account.myAccount.customerData.salutationOptions.Ms'
        )
        break
      case 'Mr':
        salutationLabel = translate(
          'account.myAccount.customerData.salutationOptions.Mr'
        )
        break
      case 'Diverse':
        salutationLabel = translate(
          'account.myAccount.customerData.salutationOptions.Diverse'
        )
        break
    }
  }

  // Format country
  const countryLabel = address.country
    ? translate(`common.countries.${address.country}`)
    : undefined

  return [
    [salutationLabel, address.firstName, address.lastName]
      .filter(Boolean)
      .join(' '),
    [address.streetName, address.streetNumber].filter(Boolean).join(' '),
    [address.postalCode, address.city].filter(Boolean).join(' '),
    countryLabel,
  ].filter((line): line is string => Boolean(line))
}
