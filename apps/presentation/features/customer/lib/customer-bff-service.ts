import {
  CustomerResponse,
  UpdateCustomerRequest,
  ChangeCustomerPasswordRequest,
} from '@core/contracts/customer/customer'
import {
  AddAddressRequest,
  AddressesResponse,
  AddressResponse,
  UpdateAddressRequest,
} from '@core/contracts/customer/address'
import { BaseService } from '@/lib/bff/services/base-service'

/**
 * Service for customer BFF operations.
 * Lives in the customer feature; lib/bff does not define or import customer.
 */
export class CustomerService extends BaseService {
  /**
   * Get current customer
   * Returns null if not authenticated (401/403)
   */
  async getCurrentCustomer(): Promise<CustomerResponse | null> {
    return await this.get<CustomerResponse | null>('/customer/me', {
      allowEmpty: true,
      onError: (res) => {
        if (res.status === 401 || res.status === 403) {
          // Not authenticated (401) or insufficient permissions (403 - wrong grant type)
          // Both are treated as "not logged in" for the frontend
          return null
        }
        // For non-auth errors, throw an error
        throw new Error(
          `Failed to fetch customer: ${res.status} ${res.statusText}`
        )
      },
    })
  }

  /**
   * Update customer data
   */
  async updateCustomer(data: UpdateCustomerRequest): Promise<CustomerResponse> {
    return await this.put<CustomerResponse>('/customer/me', data)
  }

  /**
   * Change customer password
   */
  async changePassword(data: ChangeCustomerPasswordRequest): Promise<void> {
    await this.put('/customer/me/password', data)
  }

  /**
   * Get customer addresses
   * Returns empty addresses if not authenticated (401/403)
   */
  async getAddresses(): Promise<AddressesResponse> {
    return await this.get<AddressesResponse>('/customer/me/addresses', {
      onError: (res) => {
        if (res.status === 401 || res.status === 403) {
          // Not authenticated - return empty addresses
          return {
            addresses: [],
            defaultShippingAddressId: undefined,
            defaultBillingAddressId: undefined,
            shippingAddressIds: undefined,
            billingAddressIds: undefined,
          }
        }
        throw new Error(
          `Failed to fetch addresses: ${res.status} ${res.statusText}`
        )
      },
    })
  }

  /**
   * Add a new address
   */
  async addAddress(data: AddAddressRequest): Promise<AddressResponse> {
    return await this.post<AddressResponse>('/customer/me/addresses', data)
  }

  /**
   * Update an existing address
   */
  async updateAddress(data: UpdateAddressRequest): Promise<AddressResponse> {
    return await this.put<AddressResponse>(
      `/customer/me/addresses/${data.id}`,
      data
    )
  }

  /**
   * Delete an address
   */
  async deleteAddress(addressId: string): Promise<void> {
    await this.delete(`/customer/me/addresses/${addressId}`, undefined, {
      allowEmpty: true,
    })
  }

  /**
   * Set default shipping address
   */
  async setDefaultShippingAddress(
    addressId: string
  ): Promise<{ success: true }> {
    return await this.put<{ success: true }>(
      `/customer/me/addresses/${addressId}/shipping`,
      {}
    )
  }

  /**
   * Set default billing address
   */
  async setDefaultBillingAddress(
    addressId: string
  ): Promise<{ success: true }> {
    return await this.put<{ success: true }>(
      `/customer/me/addresses/${addressId}/billing`,
      {}
    )
  }
}
