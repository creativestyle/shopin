import { z } from 'zod'

/** Accordion item body: plain string or rich text document wrapper. */
export const AccordionItemBodySchema = z.union([
  z.string(),
  z.object({ json: z.unknown() }),
])

const AccordionItemEntryApiResponseSchema = z.object({
  title: z.string().optional().nullable(),
  body: AccordionItemBodySchema.optional().nullable(),
})

export const TeaserAccordionApiResponseSchema = z.object({
  __typename: z.literal('TeaserAccordion'),
  title: z.string().optional().nullable(),
  accordion: z
    .object({
      title: z.string().optional().nullable(),
      itemsCollection: z
        .object({
          items: z.array(AccordionItemEntryApiResponseSchema),
        })
        .optional()
        .nullable(),
    })
    .optional()
    .nullable(),
})

export type TeaserAccordionApiResponse = z.infer<
  typeof TeaserAccordionApiResponseSchema
>
