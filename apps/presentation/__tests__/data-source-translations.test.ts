import { ALLOWED_DATA_SOURCES } from '@config/constants'
import enUS from '@core/i18n/en-US.json'
import deDE from '@core/i18n/de-DE.json'

const locales = { 'en-US': enUS, 'de-DE': deDE }

describe('data source selector translations', () => {
  describe.each(Object.entries(locales))('%s', (_locale, messages) => {
    const sources = messages.dataSourceSelector.sources as Record<
      string,
      { name?: string; description?: string } | undefined
    >

    it.each(ALLOWED_DATA_SOURCES)(
      'has name and description for %s',
      (source) => {
        expect(sources[source]?.name).toEqual(expect.any(String))
        expect(sources[source]?.name).not.toBe('')
        expect(sources[source]?.description).toEqual(expect.any(String))
        expect(sources[source]?.description).not.toBe('')
      }
    )
  })
})
