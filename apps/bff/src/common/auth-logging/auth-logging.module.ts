import { Global, Module } from '@nestjs/common'
import { AuthLoggerService } from './auth-logger.service'

@Global()
@Module({
  providers: [AuthLoggerService],
  exports: [AuthLoggerService],
})
export class AuthLoggingModule {}
