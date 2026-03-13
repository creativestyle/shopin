import { Injectable } from '@nestjs/common'
import type {
  CustomerResponse,
  UpdateCustomerRequest,
} from '@core/contracts/customer/customer'
import type {
  AddAddressRequest,
  UpdateAddressRequest,
  AddressResponse,
  AddressesResponse,
} from '@core/contracts/customer/address'
import { DataSourceFactory } from '../../data-source/data-source.factory'

@Injectable()
export class CustomerService {
  constructor(private readonly dataSourceFactory: DataSourceFactory) {}

  async getCurrentCustomer(): Promise<CustomerResponse> {
    const { customerService } = this.dataSourceFactory.getServices()
    return customerService.getCurrentCustomer()
  }

  async updateCustomer(
    updateCustomerRequest: UpdateCustomerRequest
  ): Promise<CustomerResponse> {
    const { customerService } = this.dataSourceFactory.getServices()
    return customerService.updateCustomer(updateCustomerRequest)
  }

  async changeCustomerPassword(changeCustomerPasswordRequest: {
    currentPassword: string
    newPassword: string
  }): Promise<void> {
    const { customerService } = this.dataSourceFactory.getServices()
    return customerService.changeCustomerPassword(changeCustomerPasswordRequest)
  }

  async getAddresses(): Promise<AddressesResponse> {
    const { customerAddressService } = this.dataSourceFactory.getServices()
    return customerAddressService.getAddresses()
  }

  async addAddress(
    addAddressRequest: AddAddressRequest
  ): Promise<AddressResponse> {
    const { customerAddressService } = this.dataSourceFactory.getServices()
    return customerAddressService.addAddress(addAddressRequest)
  }

  async updateAddress(
    updateAddressRequest: UpdateAddressRequest
  ): Promise<AddressResponse> {
    const { customerAddressService } = this.dataSourceFactory.getServices()
    return customerAddressService.updateAddress(updateAddressRequest)
  }

  async deleteAddress(addressId: string): Promise<void> {
    const { customerAddressService } = this.dataSourceFactory.getServices()
    return customerAddressService.deleteAddress(addressId)
  }

  async setDefaultShippingAddress(addressId: string): Promise<void> {
    const { customerAddressService } = this.dataSourceFactory.getServices()
    return customerAddressService.setDefaultShippingAddress(addressId)
  }

  async setDefaultBillingAddress(addressId: string): Promise<void> {
    const { customerAddressService } = this.dataSourceFactory.getServices()
    return customerAddressService.setDefaultBillingAddress(addressId)
  }
}
