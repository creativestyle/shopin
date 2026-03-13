import {
  Button,
  type ButtonScheme,
  type ButtonVariant,
} from '@/components/ui/button'
import { CmsLink } from '@/features/content/cms-link'
import type { CmsButtonResponse } from '@core/contracts/content/cms-link'

export interface CmsButtonProps {
  /** CTA from CMS: link + optional variant/style (CmsButtonResponse). */
  cta: CmsButtonResponse
  className?: string
}

/**
 * Renders a CMS CTA as the design-system Button around CmsLink. Contract: CmsButtonResponse.
 */
export function CmsButton({ cta, className }: CmsButtonProps) {
  const { link, variant, style } = cta

  return (
    <Button
      asChild
      variant={(variant ?? 'primary') as ButtonVariant}
      scheme={(style ?? 'red') as ButtonScheme}
      className={className}
    >
      <CmsLink link={link} />
    </Button>
  )
}
