import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import type {
  AddAddressRequest,
  AddressesResponse,
  AddressResponse,
  UpdateAddressRequest,
} from '@core/contracts/customer/address'
import { MockSessionService } from '../session/mock-session.service'
import {
  saveCustomer,
  type MockAddress,
  type MockCustomer,
} from '../session/mock-session-store'

function withDefaults(
  customer: MockCustomer,
  addressId: string,
  isDefaultShipping?: boolean,
  isDefaultBilling?: boolean
): MockCustomer {
  return {
    ...customer,
    defaultShippingAddressId: isDefaultShipping
      ? addressId
      : customer.defaultShippingAddressId,
    defaultBillingAddressId: isDefaultBilling
      ? addressId
      : customer.defaultBillingAddressId,
  }
}

function findAddress(customer: MockCustomer, addressId: string) {
  const address = customer.addresses.find((entry) => entry.id === addressId)
  if (!address) {
    throw new NotFoundException(`Address not found: ${addressId}`)
  }
  return address
}

@Injectable()
export class CustomerAddressService {
  constructor(private readonly sessionService: MockSessionService) {}

  async getAddresses(): Promise<AddressesResponse> {
    const customer = await this.sessionService.requireCustomer()
    const ids = customer.addresses.map((address) => address.id)
    return {
      addresses: customer.addresses,
      defaultShippingAddressId: customer.defaultShippingAddressId,
      defaultBillingAddressId: customer.defaultBillingAddressId,
      shippingAddressIds: ids,
      billingAddressIds: ids,
    }
  }

  async addAddress(request: AddAddressRequest): Promise<AddressResponse> {
    const customer = await this.sessionService.requireCustomer()
    const { isDefaultShipping, isDefaultBilling, ...fields } = request
    const address: MockAddress = {
      ...fields,
      id: `mock-address-${randomUUID()}`,
    }

    saveCustomer(
      withDefaults(
        {
          ...customer,
          addresses: [...customer.addresses, address],
          version: customer.version + 1,
        },
        address.id,
        isDefaultShipping,
        isDefaultBilling
      )
    )
    return address
  }

  async updateAddress(request: UpdateAddressRequest): Promise<AddressResponse> {
    const customer = await this.sessionService.requireCustomer()
    const { id, isDefaultShipping, isDefaultBilling, ...fields } = request
    findAddress(customer, id)
    const address: MockAddress = { ...fields, id }

    saveCustomer(
      withDefaults(
        {
          ...customer,
          addresses: customer.addresses.map((entry) =>
            entry.id === id ? address : entry
          ),
          version: customer.version + 1,
        },
        id,
        isDefaultShipping,
        isDefaultBilling
      )
    )
    return address
  }

  async deleteAddress(addressId: string): Promise<void> {
    const customer = await this.sessionService.requireCustomer()
    findAddress(customer, addressId)
    const clearIfRemoved = (id?: string) => (id === addressId ? undefined : id)

    saveCustomer({
      ...customer,
      addresses: customer.addresses.filter((entry) => entry.id !== addressId),
      defaultShippingAddressId: clearIfRemoved(
        customer.defaultShippingAddressId
      ),
      defaultBillingAddressId: clearIfRemoved(customer.defaultBillingAddressId),
      version: customer.version + 1,
    })
  }

  async setDefaultShippingAddress(addressId: string): Promise<void> {
    const customer = await this.sessionService.requireCustomer()
    findAddress(customer, addressId)
    saveCustomer({
      ...withDefaults(customer, addressId, true, false),
      version: customer.version + 1,
    })
  }

  async setDefaultBillingAddress(addressId: string): Promise<void> {
    const customer = await this.sessionService.requireCustomer()
    findAddress(customer, addressId)
    saveCustomer({
      ...withDefaults(customer, addressId, false, true),
      version: customer.version + 1,
    })
  }
}
