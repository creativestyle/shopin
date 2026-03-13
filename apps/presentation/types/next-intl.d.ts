import messages from '@core/i18n/de-DE.json'

declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof messages
  }
}
