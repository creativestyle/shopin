import type { SupportedLocale } from '@config/constants'

/**
 * The current request's language, as the BFF hands it to an integration's services.
 */
export interface LanguageProvider {
  getCurrentLanguage(): SupportedLocale
}

/**
 * The current shopper's access token and sign-in state, as the BFF hands them to an integration's services.
 */
export interface TokenProvider {
  getAccessToken(): Promise<string | undefined>
  getAuthStatus(): Promise<boolean | undefined>
}
