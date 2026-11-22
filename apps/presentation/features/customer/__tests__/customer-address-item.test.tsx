import { render, screen } from '@testing-library/react'
import type { AddressResponse } from '@core/contracts/customer/address'
import { CustomerAddressItem } from '../customer-address-item'

// Interpolates values so the address shows up in accessible names
jest.mock('next-intl', () => ({
  useTranslations:
    (ns?: string) => (key: string, values?: Record<string, string>) => {
      const fullKey = ns ? `${ns}.${key}` : key
      return values?.address ? `${fullKey} ${values.address}` : fullKey
    },
}))

jest.mock('../customer-use-customer-address-operations', () => ({
  useCustomerAddressOperations: () => ({
    handleDeleteConfirm: jest.fn(),
    isDeleteAddressPending: false,
    handleSetDefaultShipping: jest.fn(),
    handleSetDefaultBilling: jest.fn(),
    isSetDefaultShippingPending: false,
    isSetDefaultBillingPending: false,
  }),
}))

const NS = 'account.myAccount.addresses'

const address: AddressResponse = {
  id: 'addr-1',
  firstName: 'Jane',
  lastName: 'Doe',
  streetName: 'Hauptstraße',
  streetNumber: '5',
  postalCode: '10115',
  city: 'Berlin',
  country: 'DE',
}

describe('CustomerAddressItem', () => {
  beforeEach(() => {
    render(
      <CustomerAddressItem
        address={address}
        isDefaultShipping={false}
        isDefaultBilling={false}
        onEdit={jest.fn()}
      />
    )
  })

  it('is a group labelled by the address', () => {
    expect(
      screen.getByRole('group', { name: /Jane Doe.*Hauptstraße 5/ })
    ).toBeInTheDocument()
  })

  it('names edit and delete after the address', () => {
    expect(
      screen.getByRole('button', {
        name: `${NS}.editAriaLabel Jane Doe, Hauptstraße 5`,
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: `${NS}.deleteAriaLabel Jane Doe, Hauptstraße 5`,
      })
    ).toBeInTheDocument()
  })
})
