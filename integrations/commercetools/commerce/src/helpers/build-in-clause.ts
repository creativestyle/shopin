import { quoted } from '@integrations/commercetools-core'

/**
 * Builds a Commercetools where clause `in` predicate with proper escaping
 * of backslashes and double-quotes inside values.
 *
 * @example
 *   buildInClause('sku', ['abc', 'def"ghi']) // => `sku in ("abc", "def\"ghi")`
 */
export function buildInClause(field: string, values: string[]): string {
  return `${field} in (${values.map(quoted).join(', ')})`
}
