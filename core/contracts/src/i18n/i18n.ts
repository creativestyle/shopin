import { z } from 'zod'

export const LanguageCodeSchema = z
  .string()
  .min(2, 'Language code must be at least 2 characters')
  .max(5, 'Language code must be at most 5 characters')
  .regex(
    /^[a-z]{2}(-[A-Z]{2})?$/,
    'Language code must be in format "en" or "en-US"'
  )

export const TranslationsRequestSchema = z.object({
  lang: LanguageCodeSchema,
})

export type TranslationsRequest = z.infer<typeof TranslationsRequestSchema>
