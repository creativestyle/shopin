import { z } from 'zod'

/** Which integration serves each category for the request's data source. */
export const CapabilitiesResponseSchema = z.object({
  dataSource: z.string(),
  integrations: z.object({
    commerce: z.string(),
    search: z.string(),
    cms: z.string(),
    customer: z.string(),
    auth: z.string(),
    payment: z.string(),
  }),
})

export type CapabilitiesResponse = z.infer<typeof CapabilitiesResponseSchema>

export type CapabilityCategory = keyof CapabilitiesResponse['integrations']
