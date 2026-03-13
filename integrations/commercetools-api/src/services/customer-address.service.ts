import { Injectable, Scope } from '@nestjs/common'
import {
  type AddAddressRequest,
  type UpdateAddressRequest,
  type AddressResponse,
  type AddressesResponse,
  AddressResponseSchema,
} from '@core/contracts/customer/address'
import { UserClientService } from '../client/user-client.service'
import { MyCustomerApiResponseSchema } from '../schemas/customer'
import {
  MyCustomerAddressApiResponse,
  MyCustomerWithAddressesResponseSchema,
} from '../schemas/customer-address'
import { MyCustomerUpdateAction } from '@commercetools/platform-sdk'

@Injectable({ scope: Scope.REQUEST })
export class CommercetoolsCustomerAddressService {
  constructor(private readonly userClientService: UserClientService) {}

  async getAddresses(): Promise<AddressesResponse> {
    const client = await this.userClientService.getClient()
    const response = await client.me().get().execute()
    const customer = MyCustomerWithAddressesResponseSchema.parse(response.body)

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

    const response = await client
      .me()
      .post({
        body: {
          version: customer.version,
          actions: [
            {
              action: 'addAddress',
              address: addressData,
            },
          ],
        },
      })
      .execute()

    const updatedCustomer = MyCustomerWithAddressesResponseSchema.parse(
      response.body
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

    const response = await client
      .me()
      .post({
        body: {
          version: customer.version,
          actions,
        },
      })
      .execute()

    const updatedCustomer = MyCustomerWithAddressesResponseSchema.parse(
      response.body
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
    const client = await this.userClientService.getClient()
    const response = await client.me().get().execute()
    const customer = MyCustomerApiResponseSchema.parse(response.body)
    return { client, customer }
  }

  private async executeCustomerUpdate(
    client: Awaited<ReturnType<typeof this.userClientService.getClient>>,
    version: number,
    actions: MyCustomerUpdateAction[]
  ): Promise<void> {
    await client
      .me()
      .post({
        body: {
          version,
          actions,
        },
      })
      .execute()
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
