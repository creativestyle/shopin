import {
  HeaderResponseSchema,
  FooterResponseSchema,
  type HeaderResponse,
  type FooterResponse,
  type FooterSectionResponse,
} from '@core/contracts/content/layout'
import type {
  FooterItemApiResponse,
  FooterLinkApiResponse,
} from '../schemas/footer'
import type { TopBarItemApiResponse } from '../schemas/header'
import { LinkTargetSchema } from '@core/contracts/content/cms-link'
import { rfcToUrlPrefix } from '@config/constants'
import { mapLinkEntryToCmsLink } from './cms-link'

/**
 * Maps Contentful top bar item to contract HeaderResponse.
 * Validates output with HeaderResponseSchema from @core/contracts.
 * Expects a single top bar entry (service passes items[0]).
 */
export function mapTopBarItemToHeaderResponse(
  item: TopBarItemApiResponse | null | undefined
): HeaderResponse | null {
  if (item == null) {
    return null
  }
  const messages = item.topBarMessages
    ? String(item.topBarMessages)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    : []
  return HeaderResponseSchema.parse({ topBarMessages: messages })
}

/**
 * Maps Contentful footer item to contract FooterResponse.
 * Validates output with FooterResponseSchema from @core/contracts.
 * Uses locale to resolve linkedPage slugs to full URLs.
 */
export function mapFooterItemToFooterResponse(
  footer: FooterItemApiResponse,
  locale: string
): FooterResponse {
  const localePrefix = rfcToUrlPrefix(locale)

  const resolveLinkUrl = (footerLink: FooterLinkApiResponse): string => {
    const pageSlug = footerLink.linkedPage?.slug?.trim()
    if (pageSlug) {
      return `/${localePrefix}/${pageSlug}`
    }
    return (footerLink.url ?? '').trim() || '#'
  }

  const linkLabel = (footerLink: FooterLinkApiResponse): string => {
    const trimmedLabel = (footerLink.label ?? '').trim()
    if (trimmedLabel && trimmedLabel.toLowerCase() !== 'untitled') {
      return trimmedLabel
    }
    return (footerLink.url ?? '').trim() || 'Link'
  }

  const toCmsLink = (footerLink: FooterLinkApiResponse) => {
    const base = mapLinkEntryToCmsLink(footerLink)
    const resolvedUrl = resolveLinkUrl(footerLink)
    const url = resolvedUrl !== '#' ? resolvedUrl : (base?.url ?? '#')
    if (!base) {
      return { label: linkLabel(footerLink), url }
    }
    const target = footerLink.target?.trim()
      ? LinkTargetSchema.parse(footerLink.target.trim())
      : base.target
    return {
      ...base,
      label: base.label || linkLabel(footerLink),
      url,
      target,
    }
  }

  const sections: FooterSectionResponse[] = (
    footer.footerLinksCollection?.items ?? []
  ).map((footerSection) => ({
    title: (footerSection.title ?? '').trim() || 'Section',
    links: (footerSection.linksCollection?.items ?? []).map(toCmsLink),
  }))

  const legalLinks = (footer.legalLinksCollection?.items ?? []).map(toCmsLink)

  const optionalString = (value: unknown): string | undefined =>
    value != null && String(value).trim() !== ''
      ? String(value).trim()
      : undefined

  const paymentMethodsList = optionalString(footer.paymentMethodsList)
  const paymentMethods = paymentMethodsList
    ? {
        title: optionalString(footer.paymentMethodsTitle) ?? 'Payment methods',
        methods: paymentMethodsList
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean),
      }
    : undefined

  const built = {
    sections,
    legalLinks,
    copyright: optionalString(footer.copyright),
    newsletter:
      optionalString(footer.newsletterTitle) ||
      optionalString(footer.newsletterDescription)
        ? {
            title: optionalString(footer.newsletterTitle) ?? '',
            description: optionalString(footer.newsletterDescription) ?? '',
            voucherText: optionalString(footer.newsletterVoucherText),
            descriptionEnd: optionalString(footer.newsletterDescriptionEnd),
            signUpLabel: optionalString(footer.newsletterSignUpLabel),
          }
        : undefined,
    customerService: optionalString(footer.customerServiceTitle)
      ? {
          title: optionalString(footer.customerServiceTitle) ?? '',
          phone: optionalString(footer.customerServicePhone),
          hours: optionalString(footer.customerServiceHours),
          contactUs: footer.customerServiceContactUs
            ? toCmsLink(footer.customerServiceContactUs)
            : undefined,
        }
      : undefined,
    paymentMethods,
    language: optionalString(footer.languageTitle)
      ? { title: optionalString(footer.languageTitle) ?? '' }
      : undefined,
  }
  return FooterResponseSchema.parse(built)
}
