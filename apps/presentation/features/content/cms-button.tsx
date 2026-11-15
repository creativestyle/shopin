import {
  Button,
  type ButtonScheme,
  type ButtonSize,
  type ButtonVariant,
} from '@/components/ui/button'
import { CmsLink } from '@/features/content/cms-link'
import type { CmsButtonResponse } from '@core/contracts/content/cms-link'

export interface CmsButtonProps {
  /** CTA from CMS: link + optional variant/style (CmsButtonResponse). */
  cta: CmsButtonResponse
  className?: string
  /** Render as a non-interactive label, for use inside an already-linked card. */
  asLabel?: boolean
}

/**
 * Renders a CMS CTA as the design-system Button around CmsLink. Contract: CmsButtonResponse.
 */
export function CmsButton({ cta, className, asLabel }: CmsButtonProps) {
  const { link, variant, style, size } = cta

  return (
    <Button
      asChild
      variant={(variant ?? 'primary') as ButtonVariant}
      scheme={(style ?? 'red') as ButtonScheme}
      size={(size ?? 'default') as ButtonSize}
      className={className}
    >
      {asLabel ? <span>{link.label}</span> : <CmsLink link={link} />}
    </Button>
  )
}
