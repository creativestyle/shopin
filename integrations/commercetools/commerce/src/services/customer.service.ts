import { Inject, Injectable } from '@nestjs/common'
import type {
  ChangeCustomerEmailRequest,
  ChangeCustomerPasswordRequest,
  CustomerResponse,
  UpdateCustomerRequest,
} from '@core/contracts/customer/customer'
import { CustomerScope } from '../shared/customer-scope.service'
import {
  COMMERCETOOLS_CLIENT,
  type Client,
} from '@integrations/commercetools-core'
import { MyCustomerApiResponseSchema } from '../schemas/customer'
import { mapUpdateCustomerRequestToActions } from '../helpers/customer-update-actions'
import { mapCustomerToResponse } from '../mappers/customer'
import { isDuplicateEmailError } from '@integrations/commercetools-core'
import { isInvalidCurrentPasswordError } from '../helpers/is-invalid-current-password-error'
import { isInvalidCredentialsError } from '../helpers/is-invalid-credentials-error'
import { hasStatusCode } from '../helpers/has-status-code'
import { InvalidCurrentPasswordException } from '../exceptions/invalid-current-password.exception'
import { EmailInUseException } from '../exceptions/email-in-use.exception'
import { EmailUnchangedException } from '../exceptions/email-unchanged.exception'

@Injectable()
export class CommercetoolsCustomerService {
  constructor(
    private readonly scope: CustomerScope,
    @Inject(COMMERCETOOLS_CLIENT) private readonly server: Client
  ) {}

  async getCurrentCustomer(): Promise<CustomerResponse> {
    const customer = MyCustomerApiResponseSchema.parse(
      await (await this.scope.api()).customer.get()
    )
    return mapCustomerToResponse(customer)
  }

  async updateCustomer(
    updateCustomerRequest: UpdateCustomerRequest
  ): Promise<CustomerResponse> {
    const currentCustomer = await this.getCurrentCustomer()
    const actions = mapUpdateCustomerRequestToActions(updateCustomerRequest)

    if (actions.length === 0) {
      return currentCustomer
    }

    const updated = await (
      await this.scope.api()
    ).customer.update(currentCustomer.version, actions)
    return mapCustomerToResponse(MyCustomerApiResponseSchema.parse(updated))
  }

  /**
   * Changes the sign-in email after checking the current password.
   * Commercetools resets isEmailVerified on every changeEmail, so an unchanged
   * email (ignoring case) is rejected instead of sent.
   */
  async changeCustomerEmail(
    changeCustomerEmailRequest: ChangeCustomerEmailRequest
  ): Promise<CustomerResponse> {
    const { email, currentPassword } = changeCustomerEmailRequest
    const currentCustomer = await this.getCurrentCustomer()

    await this.verifyPassword(currentCustomer.email, currentPassword)

    if (email.toLowerCase() === currentCustomer.email.toLowerCase()) {
      throw new EmailUnchangedException()
    }

    try {
      return await this.postEmailChange(email, currentCustomer.version).catch(
        async (error: unknown) => {
          if (
            !hasStatusCode(error) ||
            error.statusCode !== 409 ||
            isDuplicateEmailError(error)
          ) {
            throw error
          }
          // Customer changed since its version was read; retry once with a fresh one
          const { version } = await this.getCurrentCustomer()
          return this.postEmailChange(email, version)
        }
      )
    } catch (error: unknown) {
      if (isDuplicateEmailError(error)) {
        throw new EmailInUseException()
      }
      throw error
    }
  }

  private async postEmailChange(
    email: string,
    version: number
  ): Promise<CustomerResponse> {
    const updated = await (
      await this.scope.api()
    ).customer.update(version, [{ action: 'changeEmail', email }])

    return mapCustomerToResponse(MyCustomerApiResponseSchema.parse(updated))
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
    const currentCustomer = await this.getCurrentCustomer()
    await (
      await this.scope.api()
    ).customer.changePassword(
      currentCustomer.version,
      changeCustomerPasswordRequest.currentPassword,
      changeCustomerPasswordRequest.newPassword
    )
  }

  private async verifyPassword(email: string, password: string): Promise<void> {
    try {
      await this.server.login().post({ body: { email, password } }).execute()
    } catch (error: unknown) {
      if (isInvalidCredentialsError(error)) {
        throw new InvalidCurrentPasswordException()
      }
      throw error
    }
  }
}
