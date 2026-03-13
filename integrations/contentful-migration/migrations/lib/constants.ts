/**
 * Shared constants for migrations (locales, etc.).
 */

export const LOCALES = ['en-US', 'de-DE'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE = LOCALES[0]
