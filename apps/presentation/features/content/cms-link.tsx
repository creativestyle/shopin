import Link from 'next/link'
import * as React from 'react'
import type { CmsLinkResponse } from '@core/contracts/content/cms-link'

export function getCmsLinkProps(link: CmsLinkResponse) {
  const href = link.url ?? '#'
  const target = link.target ?? undefined
  let rel = link.rel ?? undefined
  if (rel === undefined && target === '_blank') {
    rel = 'noopener noreferrer'
  }
  return { href, target, rel, 'aria-label': link.ariaLabel ?? undefined }
}

export interface CmsLinkProps {
  link: CmsLinkResponse
  className?: string
  /** When provided, used as link content instead of link.label (e.g. for teaser cards). */
  children?: React.ReactNode
  useLabelAsFallbackContent?: boolean
}

export const CmsLink = React.forwardRef<HTMLAnchorElement, CmsLinkProps>(
  function CmsLink(
    { link, className, children, useLabelAsFallbackContent = true },
    ref
  ) {
    return (
      <Link
        ref={ref}
        {...getCmsLinkProps(link)}
        title={link.title ?? undefined}
        className={className}
      >
        {children ?? (useLabelAsFallbackContent ? link.label : undefined)}
      </Link>
    )
  }
)
