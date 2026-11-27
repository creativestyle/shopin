import { ConfigModule } from '@nestjs/config'

/**
 * The global ConfigService holds no core secret: the .env file is read by loadEnvFile() (never loaded
 * wholesale into process.env), nothing is `load`ed into it, and process.env no longer has the secrets.
 * Core code imports them (coreSecret); any module, a port's included, can inject ConfigService.
 */
export const configModule = () =>
  ConfigModule.forRoot({
    isGlobal: true,
    ignoreEnvFile: true,
    validatePredefined: false,
  })
