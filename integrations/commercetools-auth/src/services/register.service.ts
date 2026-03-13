import { Injectable, Inject, ConflictException } from '@nestjs/common'
import { COMMERCETOOLS_CLIENT, Client } from '@integrations/commercetools-api'
import type {
  RegisterRequest,
  RegisterResponse,
} from '@core/contracts/auth/register'
import { CommercetoolsErrorMatcher } from '../utils/commercetools-error-matcher'

@Injectable()
export class CommercetoolsRegisterService {
  constructor(
    @Inject(COMMERCETOOLS_CLIENT) private readonly client: Client,
    private readonly errorMatcher: CommercetoolsErrorMatcher
  ) {}

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
      if (this.errorMatcher.isDuplicateEmailError(error)) {
        throw new ConflictException('Email is already in use')
      }
      throw error
    }
  }
}
