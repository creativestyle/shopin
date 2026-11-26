import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import {
  EMAIL_IN_USE_CODE,
  EMAIL_UNCHANGED_CODE,
  INVALID_CURRENT_PASSWORD_CODE,
} from '@core/contracts/customer/customer'
import type {
  ChangeCustomerEmailRequest,
  ChangeCustomerPasswordRequest,
  CustomerResponse,
  UpdateCustomerRequest,
} from '@core/contracts/customer/customer'
import { MockSessionService } from '../session/mock-session.service'
import {
  findCustomerByEmail,
  hashPassword,
  saveCustomer,
  toCustomerResponse,
  type MockCustomer,
} from '../session/mock-session-store'

// Same bodies as the commercetools exceptions, so the storefront shows the same errors
const customerError = (status: HttpStatus, message: string, code: string) =>
  new HttpException({ statusCode: status, message, code }, status)

function verifyPassword(customer: MockCustomer, password: string) {
  if (customer.passwordHash !== hashPassword(password)) {
    throw customerError(
      HttpStatus.BAD_REQUEST,
      'Invalid current password',
      INVALID_CURRENT_PASSWORD_CODE
    )
  }
}

@Injectable()
export class CustomerService {
  constructor(private readonly sessionService: MockSessionService) {}

  async getCurrentCustomer(): Promise<CustomerResponse> {
    return toCustomerResponse(await this.sessionService.requireCustomer())
  }

  async updateCustomer(
    request: UpdateCustomerRequest
  ): Promise<CustomerResponse> {
    const customer = await this.sessionService.requireCustomer()
    const updated: MockCustomer = {
      ...customer,
      firstName: request.firstName,
      lastName: request.lastName,
      salutation: request.salutation || undefined,
      dateOfBirth: request.dateOfBirth || undefined,
      version: customer.version + 1,
    }
    saveCustomer(updated)
    return toCustomerResponse(updated)
  }

  async changeCustomerPassword(
    request: ChangeCustomerPasswordRequest
  ): Promise<void> {
    const customer = await this.sessionService.requireCustomer()
    verifyPassword(customer, request.currentPassword)
    saveCustomer({
      ...customer,
      passwordHash: hashPassword(request.newPassword),
      version: customer.version + 1,
    })
  }

  async changeCustomerEmail(
    request: ChangeCustomerEmailRequest
  ): Promise<CustomerResponse> {
    const customer = await this.sessionService.requireCustomer()
    verifyPassword(customer, request.currentPassword)

    if (request.email.toLowerCase() === customer.email.toLowerCase()) {
      throw customerError(
        HttpStatus.BAD_REQUEST,
        'Email is unchanged',
        EMAIL_UNCHANGED_CODE
      )
    }
    if (findCustomerByEmail(request.email)) {
      throw customerError(
        HttpStatus.CONFLICT,
        'Email is already in use',
        EMAIL_IN_USE_CODE
      )
    }

    // Commercetools resets the verification on every email change
    const updated: MockCustomer = {
      ...customer,
      email: request.email,
      isEmailVerified: false,
      version: customer.version + 1,
    }
    saveCustomer(updated)
    return toCustomerResponse(updated)
  }
}
