import { z } from 'zod'

/** Rich text node shape for collecting asset IDs (embedded images). */
export interface RichTextNodeForCollect {
  nodeType?: string
  content?: RichTextNodeForCollect[]
  data?: { target?: { sys?: { id?: string } } }
}

export const RichTextNodeForCollectSchema: z.ZodType<RichTextNodeForCollect> =
  z.lazy(() =>
    z
      .object({
        nodeType: z.string().optional(),
        content: z.array(RichTextNodeForCollectSchema).optional(),
        data: z
          .object({
            target: z
              .object({
                sys: z.object({ id: z.string().optional() }).optional(),
              })
              .optional(),
          })
          .optional(),
      })
      .catchall(z.unknown())
  )

/** Raw page response shape for reading component entries (before full parse). */
export const RawPageDataSchema = z
  .object({
    pageCollection: z
      .object({
        items: z
          .array(
            z
              .object({
                componentsCollection: z
                  .object({ items: z.array(z.unknown()) })
                  .optional(),
              })
              .catchall(z.unknown())
          )
          .optional(),
      })
      .optional(),
  })
  .catchall(z.unknown())

/** Component entry (teaser) with __typename and optional richText. */
export const ComponentEntrySchema = z
  .object({
    __typename: z.string().optional(),
    richText: z
      .object({
        json: z.unknown(),
        links: z.unknown().optional(),
      })
      .optional()
      .nullable(),
  })
  .catchall(z.unknown())

/** Asset item from Contentful assets query (used to inject into rich text links). */
export const AssetItemSchema = z.object({
  sys: z.object({ id: z.string().optional() }).optional(),
  url: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

export type AssetItem = z.infer<typeof AssetItemSchema>
