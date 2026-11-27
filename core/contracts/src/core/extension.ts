/** Anything with `parse`: a Zod schema fits. */
export interface Parser<T> {
  parse(data: unknown): T
}

/**
 * A contract with the shop's extension (docs/extending.md): the extension's own fields, plus the base contract
 * validated as always. The base wins for its own fields, so an extension adds fields and cannot loosen or drop
 * what the framework relies on.
 */
export function extended<T>(base: Parser<T>, extension?: Parser<T>): Parser<T> {
  if (!extension) {
    return base
  }
  return {
    parse: (data) =>
      ({
        ...(extension.parse(data) as object),
        ...(base.parse(data) as object),
      }) as T,
  }
}

/**
 * A response with the shop's extension applied to the items at `path` (product cards of a search result:
 * `['products']`; the product of a wishlist item: `['items', 'product']`; arrays on the way are mapped). The
 * response is parsed with its base contract, each item with the item contract and the shop's extension of it.
 */
export function extendedAt<T>(
  base: Parser<T>,
  path: readonly string[],
  item: Parser<unknown>,
  extension?: Parser<unknown>
): Parser<T> {
  if (!extension) {
    return base
  }
  const one = extended(item, extension)
  const at = (
    parsed: unknown,
    raw: unknown,
    keys: readonly string[]
  ): unknown => {
    if (Array.isArray(parsed)) {
      return parsed.map((p, i) => at(p, (raw as unknown[])[i], keys))
    }
    if (!keys.length) {
      return one.parse(raw)
    }
    const [key, ...rest] = keys as [string, ...string[]]
    const p = parsed as Record<string, unknown> | undefined
    const r = raw as Record<string, unknown> | undefined
    if (p?.[key] === undefined || r?.[key] === undefined) {
      return parsed
    }
    return { ...p, [key]: at(p[key], r[key], rest) }
  }
  return { parse: (data) => at(base.parse(data), data, path) as T }
}
