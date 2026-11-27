import { Injectable, Inject, ConflictException } from '@nestjs/common'
import {
  COMMERCETOOLS_CLIENT,
  type Client,
} from '@integrations/commercetools-core'
import { isDuplicateEmailError } from '@integrations/commercetools-core'
import type {
  RegisterRequest,
  RegisterResponse,
} from '@core/contracts/auth/register'

@Injectable()
export class CommercetoolsRegisterService {
  constructor(@Inject(COMMERCETOOLS_CLIENT) private readonly client: Client) {}

  async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
    const customerDraft: {
      email: string
      password: string
      firstName: string
      lastName: string
      salutation?: string
      dateOfBirth?: string
    } = {
      email: registerRequest.email,
      password: registerRequest.password,
      firstName: registerRequest.firstName,
      lastName: registerRequest.lastName,
    }

    if (registerRequest.salutation) {
      customerDraft.salutation = registerRequest.salutation
    }

    if (registerRequest.dateOfBirth && registerRequest.dateOfBirth !== '') {
      customerDraft.dateOfBirth = registerRequest.dateOfBirth
    }

    try {
      await this.client.customers().post({ body: customerDraft }).execute()

      return { success: true }
    } catch (error: unknown) {
      if (isDuplicateEmailError(error)) {
        throw new ConflictException('Email is already in use')
      }
      throw error
    }
  }
}
