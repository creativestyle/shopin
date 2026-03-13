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
  contactUsLabel: z.string().optional(),
})
export type FooterCustomerService = z.infer<typeof FooterCustomerServiceSchema>

export const FooterSocialSchema = z.object({
  title: z.string(),
  links: z.array(CmsLinkSchema),
})
export type FooterSocial = z.infer<typeof FooterSocialSchema>

export const FooterGiftVoucherSchema = z.object({
  title: z.string(),
  link: CmsLinkSchema,
})
export type FooterGiftVoucher = z.infer<typeof FooterGiftVoucherSchema>

export const FooterPaymentMethodsSchema = z.object({
  title: z.string(),
  methods: z.array(z.string()),
})
export type FooterPaymentMethods = z.infer<typeof FooterPaymentMethodsSchema>

export const FooterShippingItemSchema = z.object({
  label: z.string(),
  subLabel: z.string().optional(),
})
export type FooterShippingItem = z.infer<typeof FooterShippingItemSchema>
export const FooterShippingSchema = z.object({
  title: z.string(),
  items: z.array(FooterShippingItemSchema),
})
export type FooterShipping = z.infer<typeof FooterShippingSchema>

export const FooterLanguageSchema = z.object({
  title: z.string(),
})
export type FooterLanguage = z.infer<typeof FooterLanguageSchema>

export const FooterResponseSchema = z.object({
  sections: z.array(FooterSectionResponseSchema),
  legalLinks: z.array(CmsLinkSchema),
  copyright: z.string().optional(),
  newsletter: FooterNewsletterSchema.optional(),
  customerService: FooterCustomerServiceSchema.optional(),
  social: FooterSocialSchema.optional(),
  giftVoucher: FooterGiftVoucherSchema.optional(),
  paymentMethods: FooterPaymentMethodsSchema.optional(),
  shipping: FooterShippingSchema.optional(),
  language: FooterLanguageSchema.optional(),
})
export type FooterResponse = z.infer<typeof FooterResponseSchema>
