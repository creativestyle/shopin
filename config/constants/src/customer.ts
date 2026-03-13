export const SALUTATION_OPTIONS = ['Ms', 'Mr', 'Diverse'] as const

export type SalutationOption = (typeof SALUTATION_OPTIONS)[number]
