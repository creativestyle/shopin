import {
  CmsLinkSchema,
  CmsButtonSchema,
  LinkTargetSchema,
  type CmsLinkResponse,
  type CmsButtonResponse,
} from '@core/contracts/content/cms-link'
import type {
  LinkEntryApiResponse,
  ButtonEntryApiResponse,
} from '../schemas/link'

export function mapLinkEntryToCmsLink(
  link: LinkEntryApiResponse | null | undefined
): CmsLinkResponse | undefined {
  if (link == null || (link.label == null && link.url == null)) {
    return undefined
  }
  const target = link.target
    ? LinkTargetSchema.parse(link.target.trim())
    : undefined
  return CmsLinkSchema.parse({
    label: link.label ?? '',
    url: link.url ?? undefined,
    ariaLabel: link.ariaLabel ?? undefined,
    rel: link.rel ?? undefined,
    title: link.title ?? undefined,
    noFollow: link.noFollow ?? undefined,
    noIndex: link.noIndex ?? undefined,
    target,
  })
}

/**
 * Maps Contentful button/CTA entry to contract CmsButtonResponse.
 * Validates output with CmsButtonSchema from @core/contracts.
 */
export function mapButtonEntryToCmsButton(
  cta: ButtonEntryApiResponse | null | undefined
): CmsButtonResponse | undefined {
  if (cta == null) {
    return undefined
  }
  const link = mapLinkEntryToCmsLink(cta.link ?? undefined)
  if (!link) {
    return undefined
  }
  return CmsButtonSchema.parse({
    link,
    variant: cta.variant ?? undefined,
    style: cta.style ?? undefined,
  })
}
