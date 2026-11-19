import { Injectable, Scope } from '@nestjs/common'
import type {
  ChangeCustomerEmailRequest,
  ChangeCustomerPasswordRequest,
  CustomerResponse,
  UpdateCustomerRequest,
} from '@core/contracts/customer/customer'
import { UserClientService } from '../client/user-client.service'
import { ServerClientService } from '../client/server-client.service'
import { MyCustomerApiResponseSchema } from '../schemas/customer'
import { mapUpdateCustomerRequestToActions } from '../helpers/customer-update-actions'
import { mapCustomerToResponse } from '../mappers/customer'
import { isDuplicateEmailError } from '../helpers/is-duplicate-email-error'
import { isInvalidCurrentPasswordError } from '../helpers/is-invalid-current-password-error'
import { isInvalidCredentialsError } from '../helpers/is-invalid-credentials-error'
import { hasStatusCode } from '../helpers/has-status-code'
import { InvalidCurrentPasswordException } from '../exceptions/invalid-current-password.exception'
import { EmailInUseException } from '../exceptions/email-in-use.exception'

@Injectable({ scope: Scope.REQUEST })
export class CommercetoolsCustomerService {
  constructor(
    private readonly userClientService: UserClientService,
    private readonly serverClientService: ServerClientService
  ) {}

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
    const actions = mapUpdateCustomerRequestToActions(updateCustomerRequest)

    if (actions.length === 0) {
      return currentCustomer
    }

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
  }

  /**
   * Changes the sign-in email after checking the current password.
   * Commercetools resets isEmailVerified on every changeEmail, so an unchanged
   * email (ignoring case) is a no-op.
   */
  async changeCustomerEmail(
    changeCustomerEmailRequest: ChangeCustomerEmailRequest
  ): Promise<CustomerResponse> {
    const currentCustomer = await this.getCurrentCustomer()

    await this.verifyPassword(
      currentCustomer.email,
      changeCustomerEmailRequest.currentPassword
    )

    if (
      changeCustomerEmailRequest.email.toLowerCase() ===
      currentCustomer.email.toLowerCase()
    ) {
      return currentCustomer
    }

    const client = await this.userClientService.getClient()

    try {
      const response = await client
        .me()
        .post({
          body: {
            actions: [
              {
                action: 'changeEmail',
                email: changeCustomerEmailRequest.email,
              },
            ],
            version: currentCustomer.version,
          },
        })
        .execute()

      const updatedCustomer = MyCustomerApiResponseSchema.parse(response.body)

      return mapCustomerToResponse(updatedCustomer)
    } catch (error: unknown) {
      if (isDuplicateEmailError(error)) {
        throw new EmailInUseException()
      }
      throw error
    }
  }

  async changeCustomerPassword(
    changeCustomerPasswordRequest: ChangeCustomerPasswordRequest
  ): Promise<void> {
    try {
      await this.postPasswordChange(changeCustomerPasswordRequest).catch(
        (error: unknown) => {
          if (!hasStatusCode(error) || error.statusCode !== 409) {
            throw error
          }
          // Customer changed since its version was read; retry once with a fresh one
          return this.postPasswordChange(changeCustomerPasswordRequest)
        }
      )
    } catch (error) {
      if (isInvalidCurrentPasswordError(error)) {
        throw new InvalidCurrentPasswordException()
      }
      throw error
    }
  }

  private async postPasswordChange(
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

  private async verifyPassword(email: string, password: string): Promise<void> {
    try {
      await this.serverClientService
        .getClient()
        .login()
        .post({ body: { email, password } })
        .execute()
    } catch (error: unknown) {
      if (isInvalidCredentialsError(error)) {
        throw new InvalidCurrentPasswordException()
      }
      throw error
    }
  }
}
