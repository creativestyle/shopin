import { z } from 'zod'

export const FacetTermSchema = z.object({
  term: z.string(),
  label: z.string(),
  count: z.number().int().min(0),
  colorHex: z.string().optional(),
})

export type FacetTerm = z.infer<typeof FacetTermSchema>

export const FacetDisplayTypeSchema = z.enum(['color', 'size', 'text'])

export type FacetDisplayType = z.infer<typeof FacetDisplayTypeSchema>

export const FacetSchema = z.object({
  name: z.string(),
  label: z.string(),
  displayType: FacetDisplayTypeSchema,
  terms: z.array(FacetTermSchema),
})

export type Facet = z.infer<typeof FacetSchema>

export const FacetsResponseSchema = z.array(FacetSchema)

export type FacetsResponse = z.infer<typeof FacetsResponseSchema>

export const AppliedFilterSchema = z.object({
  name: z.string(),
  value: z.string(),
})

export type AppliedFilter = z.infer<typeof AppliedFilterSchema>

export const AppliedFiltersSchema = z.array(AppliedFilterSchema)

export type AppliedFilters = z.infer<typeof AppliedFiltersSchema>
