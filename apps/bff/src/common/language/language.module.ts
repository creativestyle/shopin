import { Module, Global } from '@nestjs/common'
import { LanguageProvider } from './language.provider'
import { LanguageHeaderMiddleware } from './language-header.middleware'
import { LANGUAGE_TOKEN } from '@core/i18n'

@Global()
@Module({
  providers: [
    LanguageHeaderMiddleware,
    {
      provide: LANGUAGE_TOKEN,
      useClass: LanguageProvider,
    },
  ],
  exports: [LANGUAGE_TOKEN, LanguageHeaderMiddleware],
})
export class LanguageModule {}
