import { z } from 'zod'

const richTextLinksAssetsSchema = z.object({
  assets: z
    .object({
      block: z
        .array(
          z.object({
            sys: z.object({ id: z.string().optional() }).optional(),
            url: z.string().optional().nullable(),
            title: z.string().optional().nullable(),
          })
        )
        .optional(),
      hyperlink: z
        .array(
          z.object({
            sys: z.object({ id: z.string().optional() }).optional(),
            url: z.string().optional().nullable(),
            title: z.string().optional().nullable(),
          })
        )
        .optional(),
    })
    .optional(),
})

export const TeaserRichTextApiResponseSchema = z.object({
  __typename: z.literal('TeaserRichText'),
  title: z.string().optional().nullable(),
  richText: z
    .object({
      json: z.unknown().optional().nullable(),
      links: richTextLinksAssetsSchema.optional(),
    })
    .optional()
    .nullable(),
})

export type TeaserRichTextApiResponse = z.infer<
  typeof TeaserRichTextApiResponseSchema
>
