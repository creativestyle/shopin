import { Module, Global, Scope } from '@nestjs/common'
import { faker, fakerDE } from '@faker-js/faker'
import { LANGUAGE_TOKEN } from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'

export const MOCK_API = 'MOCK_API'

export class MockApi {
  private readonly faker: typeof faker

  constructor(languageProvider: LanguageProvider) {
    this.faker = this.getFakerInstance(languageProvider)
  }

  private getFakerInstance(languageProvider: LanguageProvider) {
    const currentLanguage = languageProvider.getCurrentLanguage()
    switch (currentLanguage) {
      case 'de-DE':
        return fakerDE
      default:
        return faker
    }
  }

  getFaker(): typeof faker {
    return this.faker
  }
}

@Global()
@Module({
  providers: [
    {
      provide: MOCK_API,
      scope: Scope.REQUEST,
      inject: [LANGUAGE_TOKEN],
      useFactory: (languageProvider: LanguageProvider) =>
        new MockApi(languageProvider),
    },
  ],
  exports: [MOCK_API],
})
export class MockClientModule {}
