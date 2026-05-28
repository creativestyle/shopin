import { cache } from 'react'
import { resolveVary } from '@/lib/vary/vary-key'

const getHolder = cache((): { value: Record<string, string> | undefined } => ({
  value: undefined,
}))

export function setRequestVary(resolved: Record<string, string>): void {
  getHolder().value = resolved
}

export function getRequestVary(): Record<string, string> {
  const { value } = getHolder()
  if (value === undefined) {
    if (process.env.NODE_ENV === 'development') {
      throw new Error(
        'getRequestVary() called before setRequestVary(). ' +
          'Ensure [vary]/[locale]/layout.tsx calls setRequestVary(decodeVary(vary)) before any BFF fetches.'
      )
    }
    return resolveVary(() => undefined)
  }
  return value
}
