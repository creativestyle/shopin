import { AddressRequestSchema } from '@core/contracts/address/address-base'
import {
  SetBillingAddressRequestSchema,
  SetShippingAddressRequestSchema,
} from '@core/contracts/cart/cart'

const savedAddressWithoutNumber = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  streetName: 'Hauptstraße 5',
  postalCode: '10115',
  city: 'Berlin',
  country: 'DE',
}

describe('address schemas: street number', () => {
  it('rejects an empty street number from the form', () => {
    const result = AddressRequestSchema.safeParse({
      ...savedAddressWithoutNumber,
      streetNumber: '',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ['streetNumber'],
        message: 'address.errors.streetNumberRequired',
      }),
    ])
  })

  it.each([
    ['shipping', SetShippingAddressRequestSchema],
    ['billing', SetBillingAddressRequestSchema],
  ])(
    'accepts a saved address without a street number as cart %s address',
    (_, schema) => {
      expect(schema.safeParse(savedAddressWithoutNumber).success).toBe(true)
    }
  )
})
