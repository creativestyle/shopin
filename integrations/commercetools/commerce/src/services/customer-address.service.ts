import { Injectable } from '@nestjs/common'
import {
  type AddAddressRequest,
  type UpdateAddressRequest,
  type AddressResponse,
  type AddressesResponse,
  AddressResponseSchema,
} from '@core/contracts/customer/address'
import {
  CustomerScope,
  type ShopperApi,
} from '../shared/customer-scope.service'
import { MyCustomerApiResponseSchema } from '../schemas/customer'
import {
  MyCustomerAddressApiResponse,
  MyCustomerWithAddressesResponseSchema,
} from '../schemas/customer-address'
import { MyCustomerUpdateAction } from '@commercetools/platform-sdk'

@Injectable()
export class CommercetoolsCustomerAddressService {
  constructor(private readonly scope: CustomerScope) {}

  async getAddresses(): Promise<AddressesResponse> {
    const customer = MyCustomerWithAddressesResponseSchema.parse(
      await (await this.scope.api()).customer.get()
    )

    return {
      addresses: customer.addresses || [],
      defaultShippingAddressId: customer.defaultShippingAddressId,
      defaultBillingAddressId: customer.defaultBillingAddressId,
      shippingAddressIds: customer.shippingAddressIds,
      billingAddressIds: customer.billingAddressIds,
    }
  }

  async addAddress(
    addAddressRequest: AddAddressRequest
  ): Promise<AddressResponse> {
    const { client, customer } = await this.getCurrentCustomer()
    const { isDefaultShipping, isDefaultBilling, ...addressData } =
      addAddressRequest

    const updatedCustomer = MyCustomerWithAddressesResponseSchema.parse(
      await client.customer.update(customer.version, [
        { action: 'addAddress', address: addressData },
      ])
    )
    const newAddress =
      updatedCustomer.addresses?.[updatedCustomer.addresses.length - 1]

    if (!newAddress) {
      throw new Error('Failed to add address')
    }

    // Adding addresses to shipping and billing address so they are available for selection
    const actions: MyCustomerUpdateAction[] = [
      {
        action: 'addShippingAddressId',
        addressId: newAddress.id,
      },
      {
        action: 'addBillingAddressId',
        addressId: newAddress.id,
      },
    ]

    this.addDefaultAddressActions(
      actions,
      newAddress.id,
      isDefaultShipping,
      isDefaultBilling
    )

    await this.executeCustomerUpdate(client, updatedCustomer.version, actions)

    return AddressResponseSchema.parse(newAddress)
  }

  async updateAddress(
    updateAddressRequest: UpdateAddressRequest
  ): Promise<AddressResponse> {
    const { client, customer } = await this.getCurrentCustomer()
    const { id, isDefaultShipping, isDefaultBilling, ...addressData } =
      updateAddressRequest

    const actions: MyCustomerUpdateAction[] = [
      {
        action: 'changeAddress',
        addressId: id,
        address: addressData,
      },
    ]

    this.addDefaultAddressActions(
      actions,
      id,
      isDefaultShipping,
      isDefaultBilling
    )

    const updatedCustomer = MyCustomerWithAddressesResponseSchema.parse(
      await client.customer.update(customer.version, actions)
    )
    const updatedAddress = updatedCustomer.addresses?.find(
      (addr: MyCustomerAddressApiResponse) => addr.id === id
    )

    if (!updatedAddress) {
      throw new Error('Address not found after update')
    }

    return AddressResponseSchema.parse(updatedAddress)
  }

  async deleteAddress(addressId: string): Promise<void> {
    const { client, customer } = await this.getCurrentCustomer()

    await this.executeCustomerUpdate(client, customer.version, [
      {
        action: 'removeAddress',
        addressId,
      },
    ])
  }

  async setDefaultShippingAddress(addressId: string): Promise<void> {
    const { client, customer } = await this.getCurrentCustomer()

    await this.executeCustomerUpdate(client, customer.version, [
      {
        action: 'setDefaultShippingAddress',
        addressId,
      },
    ])
  }

  async setDefaultBillingAddress(addressId: string): Promise<void> {
    const { client, customer } = await this.getCurrentCustomer()

    await this.executeCustomerUpdate(client, customer.version, [
      {
        action: 'setDefaultBillingAddress',
        addressId,
      },
    ])
  }

  private async getCurrentCustomer() {
    const client = await this.scope.api()
    const customer = MyCustomerApiResponseSchema.parse(
      await client.customer.get()
    )
    return { client, customer }
  }

  private async executeCustomerUpdate(
    client: ShopperApi,
    version: number,
    actions: MyCustomerUpdateAction[]
  ): Promise<void> {
    await client.customer.update(version, actions)
  }

  private addDefaultAddressActions(
    actions: MyCustomerUpdateAction[],
    addressId: string,
    isDefaultShipping?: boolean,
    isDefaultBilling?: boolean
  ): void {
    if (isDefaultShipping === true) {
      actions.push({
        action: 'setDefaultShippingAddress',
        addressId,
      })
    }
    if (isDefaultBilling === true) {
      actions.push({
        action: 'setDefaultBillingAddress',
        addressId,
      })
    }
  }
}
