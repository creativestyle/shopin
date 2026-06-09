import { cache } from 'react'

const getHolder = cache((): { value: Record<string, string> | undefined } => ({
  value: undefined,
}))

export function setRequestVariant(resolved: Record<string, string>): void {
  getHolder().value = resolved
}

/**
 * Returns the variant dimensions set by the [variant]/[locale] layout for this render,
 * or `undefined` when the layout has not run (e.g. SPA client navigation within
 * the same layout tree). Callers that receive `undefined` must fall back to
 * cookie-based resolution so the correct data source is used.
 */
export function getRequestVariant(): Record<string, string> | undefined {
  return getHolder().value
}
