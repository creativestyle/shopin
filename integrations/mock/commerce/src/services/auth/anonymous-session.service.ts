import { Injectable } from '@nestjs/common'
import type {
  AnonymousSessionResponse,
  AnonymousSessionTokenFields,
} from '@core/contracts/auth/anonymous-session'
import { openSession } from '../../session/mock-session-store'

@Injectable()
export class MockAnonymousSessionService {
  async createAnonymousSession(): Promise<
    AnonymousSessionResponse & AnonymousSessionTokenFields
  > {
    return { success: true, ...openSession().tokens }
  }
}
