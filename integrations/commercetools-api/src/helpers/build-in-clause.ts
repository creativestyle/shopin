/**
 * Builds a Commercetools where clause `in` predicate with proper escaping
 * of backslashes and double-quotes inside values.
 *
 * @example
 *   buildInClause('sku', ['abc', 'def"ghi']) // => `sku in ("abc", "def\"ghi")`
 */
export function buildInClause(field: string, values: string[]): string {
  const escaped = values
    .map((value) => `"${escapeWhereStringValue(value)}"`)
    .join(', ')

  return `${field} in (${escaped})`
}

/**
 * Escapes backslashes and double-quotes so the value is safe to insert
 * inside a Commercetools where-clause double-quoted string.
 */
function escapeWhereStringValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
