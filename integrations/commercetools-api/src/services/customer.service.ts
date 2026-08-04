import { Injectable, Scope } from '@nestjs/common'
import type {
  ChangeCustomerPasswordRequest,
  CustomerResponse,
  UpdateCustomerRequest,
} from '@core/contracts/customer/customer'
import { UserClientService } from '../client/user-client.service'
import { MyCustomerApiResponseSchema } from '../schemas/customer'
import { mapUpdateCustomerRequestToActions } from '../helpers/customer-update-actions'
import { mapCustomerToResponse } from '../mappers/customer'
import { isDuplicateEmailError } from '../helpers/is-duplicate-email-error'
import { EmailAlreadyInUseException } from '../exceptions/email-already-in-use.exception'

@Injectable({ scope: Scope.REQUEST })
export class CommercetoolsCustomerService {
  constructor(private readonly userClientService: UserClientService) {}

  async getCurrentCustomer(): Promise<CustomerResponse> {
    const client = await this.userClientService.getClient()
    const response = await client.me().get().execute()
    const customer = MyCustomerApiResponseSchema.parse(response.body)

    return mapCustomerToResponse(customer)
  }

  async updateCustomer(
    updateCustomerRequest: UpdateCustomerRequest
  ): Promise<CustomerResponse> {
    const client = await this.userClientService.getClient()
    const currentCustomer = await this.getCurrentCustomer()
    const actions = mapUpdateCustomerRequestToActions(
      updateCustomerRequest,
      currentCustomer
    )

    if (actions.length === 0) {
      return currentCustomer
    }

    try {
      const response = await client
        .me()
        .post({
          body: {
            actions,
            version: currentCustomer.version,
          },
        })
        .execute()

      const updatedCustomer = MyCustomerApiResponseSchema.parse(response.body)

      return mapCustomerToResponse(updatedCustomer)
    } catch (error: unknown) {
      if (isDuplicateEmailError(error)) {
        throw new EmailAlreadyInUseException()
      }
      throw error
    }
  }

  async changeCustomerPassword(
    changeCustomerPasswordRequest: ChangeCustomerPasswordRequest
  ): Promise<void> {
    const client = await this.userClientService.getClient()
    const currentCustomer = await this.getCurrentCustomer()

    await client
      .me()
      .password()
      .post({
        body: {
          currentPassword: changeCustomerPasswordRequest.currentPassword,
          newPassword: changeCustomerPasswordRequest.newPassword,
          version: currentCustomer.version,
        },
      })
      .execute()
  }
}
