import { PinoLogger } from 'nestjs-pino'
import { I18nService } from './i18n.service'

function createMockLogger(): PinoLogger {
  return {
    setContext: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    verbose: jest.fn(),
    fatal: jest.fn(),
  } as unknown as PinoLogger
}

describe('I18nService', () => {
  it('returns translations for supported language', async () => {
    const service = new I18nService(createMockLogger())
    const en = await service.getTranslations('en-US')
    expect(en).toBeTruthy()
  })

  it('falls back for unsupported language', async () => {
    const service = new I18nService(createMockLogger())
    const tr = await service.getTranslations('xx-YY')
    const def = await service.getTranslations('en-US')
    expect(tr).toStrictEqual(def)
  })

  it('returns available languages', async () => {
    const service = new I18nService(createMockLogger())
    const langs = await service.getAvailableLanguages()
    expect(Array.isArray(langs)).toBe(true)
    expect(langs.length).toBeGreaterThan(0)
  })
})
