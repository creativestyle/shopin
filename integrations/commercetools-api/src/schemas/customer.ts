import { z } from 'zod'
import { SALUTATION_OPTIONS } from '@config/constants'

export const MyCustomerApiResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  salutation: z.enum([...SALUTATION_OPTIONS, '']).optional(),
  dateOfBirth: z.string().optional(),
  version: z.number(),
  isEmailVerified: z.boolean().optional(),
})

export type MyCustomerApiResponse = z.infer<typeof MyCustomerApiResponseSchema>
