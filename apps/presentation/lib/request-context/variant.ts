import { cache } from 'react'
import { AsyncLocalStorage } from 'node:async_hooks'
import { decodeVariant } from '@/lib/variant/variant-key'

const getHolder = cache((): { value: Record<string, string> | undefined } => ({
  value: undefined,
}))

const variantAls = new AsyncLocalStorage<Record<string, string>>()

export function setRequestVariant(resolved: Record<string, string>): void {
  getHolder().value = resolved
}

export function setRequestVariantFromSegment(segment: string): void {
  setRequestVariant(decodeVariant(segment))
}

export function getRequestVariant(): Record<string, string> | undefined {
  return variantAls.getStore() ?? getHolder().value
}

export function runWithRequestVariant<T>(
  resolved: Record<string, string>,
  fn: () => T
): T {
  return variantAls.run(resolved, fn)
}

export function runWithRequestVariantFromSegment<T>(
  segment: string,
  fn: () => T
): T {
  return runWithRequestVariant(decodeVariant(segment), fn)
}
