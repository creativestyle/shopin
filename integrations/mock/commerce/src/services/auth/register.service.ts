import { ConflictException, Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import type {
  RegisterRequest,
  RegisterResponse,
} from '@core/contracts/auth/register'
import {
  findCustomerByEmail,
  hashPassword,
  saveCustomer,
} from '../../session/mock-session-store'

@Injectable()
export class MockRegisterService {
  async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
    if (findCustomerByEmail(registerRequest.email)) {
      throw new ConflictException('Email is already in use')
    }
    saveCustomer({
      id: `mock-customer-${randomUUID()}`,
      email: registerRequest.email.trim(),
      firstName: registerRequest.firstName,
      lastName: registerRequest.lastName,
      salutation: registerRequest.salutation || undefined,
      dateOfBirth: registerRequest.dateOfBirth || undefined,
      version: 1,
      passwordHash: hashPassword(registerRequest.password),
      isEmailVerified: false,
      addresses: [],
    })
    return { success: true }
  }
}
