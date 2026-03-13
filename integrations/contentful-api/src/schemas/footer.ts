import { z } from 'zod'
import { LinkEntryApiResponseSchema } from './link'

/** Footer link with optional linkedPage reference (Contentful). */
const FooterLinkApiResponseSchema = LinkEntryApiResponseSchema.extend({
  linkedPage: z
    .object({
      slug: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
})

const FooterSectionItemApiResponseSchema = z.object({
  title: z.string().optional().nullable(),
  linksCollection: z
    .object({
      items: z.array(FooterLinkApiResponseSchema).optional().nullable(),
    })
    .optional()
    .nullable(),
})

/** Single footer entry from Contentful footerCollection. */
export const FooterItemApiResponseSchema = z.object({
  copyright: z.string().optional().nullable(),
  footerLinksCollection: z
    .object({
      items: z.array(FooterSectionItemApiResponseSchema).optional().nullable(),
    })
    .optional()
    .nullable(),
  legalLinksCollection: z
    .object({
      items: z.array(FooterLinkApiResponseSchema).optional().nullable(),
    })
    .optional()
    .nullable(),
  socialLinksCollection: z
    .object({
      items: z.array(FooterLinkApiResponseSchema).optional().nullable(),
    })
    .optional()
    .nullable(),
  paymentMethodsList: z.string().optional().nullable(),
  paymentMethodsTitle: z.string().optional().nullable(),
  shippingItemsList: z.string().optional().nullable(),
  shippingTitle: z.string().optional().nullable(),
  languageTitle: z.string().optional().nullable(),
  newsletterTitle: z.string().optional().nullable(),
  newsletterDescription: z.string().optional().nullable(),
  newsletterVoucherText: z.string().optional().nullable(),
  newsletterDescriptionEnd: z.string().optional().nullable(),
  newsletterSignUpLabel: z.string().optional().nullable(),
  customerServiceTitle: z.string().optional().nullable(),
  customerServicePhone: z.string().optional().nullable(),
  customerServiceHours: z.string().optional().nullable(),
  customerServiceContactUsLabel: z.string().optional().nullable(),
  socialTitle: z.string().optional().nullable(),
  giftVoucherTitle: z.string().optional().nullable(),
  giftVoucherLinkLabel: z.string().optional().nullable(),
  giftVoucherLinkUrl: z.string().optional().nullable(),
})

/** GraphQL response shape for layout footer query. */
export const FooterLayoutApiResponseSchema = z.object({
  footerCollection: z
    .object({
      items: z.array(FooterItemApiResponseSchema).optional().nullable(),
    })
    .optional()
    .nullable(),
})

export type FooterLinkApiResponse = z.infer<typeof FooterLinkApiResponseSchema>
export type FooterSectionItemApiResponse = z.infer<
  typeof FooterSectionItemApiResponseSchema
>
export type FooterItemApiResponse = z.infer<typeof FooterItemApiResponseSchema>
export type FooterLayoutApiResponse = z.infer<
  typeof FooterLayoutApiResponseSchema
>
