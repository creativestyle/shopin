import { z } from 'zod'
import { CmsLinkSchema } from './cms-link'

export const HeaderResponseSchema = z.object({
  topBarMessages: z.array(z.string()),
})
export type HeaderResponse = z.infer<typeof HeaderResponseSchema>

export const FooterSectionResponseSchema = z.object({
  title: z.string(),
  links: z.array(CmsLinkSchema),
})
export type FooterSectionResponse = z.infer<typeof FooterSectionResponseSchema>

export const FooterNewsletterSchema = z.object({
  title: z.string(),
  description: z.string(),
  voucherText: z.string().optional(),
  descriptionEnd: z.string().optional(),
  signUpLabel: z.string().optional(),
})
export type FooterNewsletter = z.infer<typeof FooterNewsletterSchema>

export const FooterCustomerServiceSchema = z.object({
  title: z.string(),
  phone: z.string().optional(),
  hours: z.string().optional(),
  contactUs: CmsLinkSchema.optional(),
})
export type FooterCustomerService = z.infer<typeof FooterCustomerServiceSchema>

export const FooterPaymentMethodsSchema = z.object({
  title: z.string(),
  methods: z.array(z.string()),
})
export type FooterPaymentMethods = z.infer<typeof FooterPaymentMethodsSchema>

export const FooterCountrySchema = z.object({
  title: z.string(),
})
export type FooterCountry = z.infer<typeof FooterCountrySchema>

export const FooterResponseSchema = z.object({
  sections: z.array(FooterSectionResponseSchema),
  legalLinks: z.array(CmsLinkSchema),
  copyright: z.string().optional(),
  newsletter: FooterNewsletterSchema.optional(),
  customerService: FooterCustomerServiceSchema.optional(),
  paymentMethods: FooterPaymentMethodsSchema.optional(),
  country: FooterCountrySchema.optional(),
})
export type FooterResponse = z.infer<typeof FooterResponseSchema>
