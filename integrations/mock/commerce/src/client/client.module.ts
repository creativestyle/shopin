import { RequestContext } from '@core/integration-kit'
import { Module, Global } from '@nestjs/common'
import type { Faker } from '@faker-js/faker' with {
  'resolution-mode': 'import',
}

export const MOCK_API = 'MOCK_API'

type FakerLocales = { faker: Faker; fakerDE: Faker }

// @faker-js/faker is ESM-only; load it once via dynamic import from this CommonJS module
let fakerLocales: Promise<FakerLocales> | undefined
const loadFakerLocales = () =>
  (fakerLocales ??= import('@faker-js/faker').then(({ faker, fakerDE }) => ({
    faker,
    fakerDE,
  })))

export class MockApi {
  constructor(
    private readonly context: RequestContext,
    private readonly locales: FakerLocales
  ) {}

  /** The faker of the current request's language (a singleton; the language is read per call). */
  getFaker(): Faker {
    return this.context.getCurrentLanguage() === 'de-DE'
      ? this.locales.fakerDE
      : this.locales.faker
  }
}

@Global()
@Module({
  providers: [
    {
      provide: MOCK_API,
      inject: [RequestContext],
      useFactory: async (languageProvider: RequestContext) =>
        new MockApi(languageProvider, await loadFakerLocales()),
    },
  ],
  exports: [MOCK_API],
})
export class MockClientModule {}
