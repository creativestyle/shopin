import getI18nRequestConfig from '../request'
import {
  I18N_CONFIG,
  listLocales,
  getDefaultLocale,
  urlPrefixToRfc,
} from '@config/constants'

// Avoid importing ESM next-intl modules in Jest by mocking the server entry
jest.mock('next-intl/server', () => ({
  getRequestConfig: (fn: (arg: unknown) => unknown) => fn,
  getLocale: () => Promise.resolve('en'),
  getMessages: () => Promise.resolve({}),
}))

const mockGetTranslations = jest.fn()

jest.mock('../../lib/bff/services/server-service', () => ({
  getServerBffClient: () =>
    Promise.resolve({
      i18nService: {
        getTranslations: mockGetTranslations,
      },
    }),
}))

describe('i18n/request getRequestConfig', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches default translations and returns default prefix for invalid locale', async () => {
    const messages = { fallback: true }
    const defaultPrefix = getDefaultLocale().urlPrefix
    mockGetTranslations.mockResolvedValueOnce({
      locale: defaultPrefix,
      messages,
    })

    const cfg = await getI18nRequestConfig({
      requestLocale: Promise.resolve('xx'),
    } as unknown as Parameters<typeof getI18nRequestConfig>[0])

    expect(cfg.locale).toBe(defaultPrefix)
    expect(cfg.messages).toStrictEqual(messages)
    expect(mockGetTranslations).toHaveBeenCalledWith(
      I18N_CONFIG.defaultLocale,
      defaultPrefix
    )
  })

  it('fetches translations for a valid locale prefix and returns messages', async () => {
    const validPrefix = listLocales()[0].urlPrefix
    const expectedRfc = urlPrefixToRfc(validPrefix)
    const messages = { hello: 'world' }
    mockGetTranslations.mockResolvedValue({
      locale: validPrefix,
      messages,
    })

    const cfg = await getI18nRequestConfig({
      requestLocale: Promise.resolve(validPrefix),
    } as unknown as Parameters<typeof getI18nRequestConfig>[0])

    expect(mockGetTranslations).toHaveBeenCalledWith(expectedRfc, validPrefix)
    expect(cfg.locale).toBe(validPrefix)
    expect(cfg.messages).toStrictEqual(messages)
  })

  it('returns empty messages when BFF responds non-ok', async () => {
    const validPrefix = listLocales()[0].urlPrefix
    const expectedRfc = urlPrefixToRfc(validPrefix)
    mockGetTranslations.mockResolvedValue({
      locale: validPrefix,
      messages: {},
    })

    const cfg = await getI18nRequestConfig({
      requestLocale: Promise.resolve(validPrefix),
    } as unknown as Parameters<typeof getI18nRequestConfig>[0])

    expect(mockGetTranslations).toHaveBeenCalledWith(expectedRfc, validPrefix)
    expect(cfg.locale).toBe(validPrefix)
    expect(cfg.messages).toStrictEqual({})
  })
})
