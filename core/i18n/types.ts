// Shared types for i18n module
export type TranslationValue = string | { [key: string]: TranslationValue }
export type Translations = Record<string, TranslationValue>
