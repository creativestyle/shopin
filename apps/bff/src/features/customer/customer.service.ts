import { Injectable } from '@nestjs/common'
import type {
  ChangeCustomerEmailRequest,
  ChangeCustomerEmailResponse,
  CustomerResponse,
  UpdateCustomerRequest,
} from '@core/contracts/customer/customer'
import type {
  AddAddressRequest,
  UpdateAddressRequest,
  AddressResponse,
  AddressesResponse,
} from '@core/contracts/customer/address'
import { Ports, Services } from '../../data-source/ports.module'
import { SessionService } from '../../common/session/session.service'

@Injectable()
export class CustomerService {
  constructor(
    private readonly services: Services,
    private readonly session: SessionService,
    private readonly ports: Ports
  ) {}

  async getCurrentCustomer(): Promise<CustomerResponse> {
    const { customerService } = this.services
    return customerService.getCurrentCustomer()
  }

  async updateCustomer(
    updateCustomerRequest: UpdateCustomerRequest
  ): Promise<CustomerResponse> {
    const { customerService } = this.services
    return customerService.updateCustomer(updateCustomerRequest)
  }

  async changeCustomerPassword(changeCustomerPasswordRequest: {
    currentPassword: string
    newPassword: string
  }): Promise<void> {
    const { customerService } = this.services
    await customerService.changeCustomerPassword(changeCustomerPasswordRequest)
    // every other session of this shopper stops working (server-side); this one is re-issued
    await this.session.revokeOtherSessions()
  }

  async changeCustomerEmail(
    changeCustomerEmailRequest: ChangeCustomerEmailRequest
  ): Promise<ChangeCustomerEmailResponse> {
    const { customerService } = this.services
    const customer = await customerService.changeCustomerEmail(
      changeCustomerEmailRequest
    )

    if (customer.isEmailVerified !== false) {
      return { customer }
    }

    // TODO: temporary solution to return email token to frontend, it should send email.
    // The token comes from the identity provider's account flows; without one the change stands without a token.
    const generateEmailTokenService =
      this.ports.auth?.accountFlows?.generateEmailTokenService
    if (!generateEmailTokenService) {
      return { customer }
    }
    const { emailToken } = await generateEmailTokenService.generateEmailToken({
      email: customer.email,
    })

    return { customer, emailToken }
  }

  async getAddresses(): Promise<AddressesResponse> {
    const { customerAddressService } = this.services
    return customerAddressService.getAddresses()
  }

  async addAddress(
    addAddressRequest: AddAddressRequest
  ): Promise<AddressResponse> {
    const { customerAddressService } = this.services
    return customerAddressService.addAddress(addAddressRequest)
  }

  async updateAddress(
    updateAddressRequest: UpdateAddressRequest
  ): Promise<AddressResponse> {
    const { customerAddressService } = this.services
    return customerAddressService.updateAddress(updateAddressRequest)
  }

  async deleteAddress(addressId: string): Promise<void> {
    const { customerAddressService } = this.services
    return customerAddressService.deleteAddress(addressId)
  }

  async setDefaultShippingAddress(addressId: string): Promise<void> {
    const { customerAddressService } = this.services
    return customerAddressService.setDefaultShippingAddress(addressId)
  }

  async setDefaultBillingAddress(addressId: string): Promise<void> {
    const { customerAddressService } = this.services
    return customerAddressService.setDefaultBillingAddress(addressId)
  }
}
