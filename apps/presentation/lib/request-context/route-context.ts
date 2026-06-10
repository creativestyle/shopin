import { setRequestLocale } from 'next-intl/server'
import { setRequestVariantFromSegment } from './variant'
import { isVariantSegment } from '@/lib/variant/variant-key'

/**
 * Per-render context initialiser for every [variant]/[locale] page & layout.
 *
 * MUST be called by each server segment. Under ISR a segment renders
 * independently of its (possibly cached) parent layout, so children cannot
 * rely on the layout having already run. Setting both locale and variant here
 * keeps them in sync — neither can be set without the other.
 *
 * ISR-safe: reads only from route params, never from headers()/cookies().
 *
 * Sets:
 *  - next-intl locale   (enables getTranslations(), getMessages(), etc.)
 *  - request variant    (server BFF fetches hit the selected data source)
 */
export function initRouteContext({
  variant,
  locale,
}: {
  variant: string
  locale: string
}): void {
  if (!isVariantSegment(variant)) {
    throw new Error(`Invalid variant segment: "${variant}"`)
  }
  setRequestLocale(locale)
  setRequestVariantFromSegment(variant)
}
