const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/**
 * Returns the URL if it is safe to use as an href: a root-relative path or an
 * http(s), mailto or tel URL. Protocol-relative URLs are upgraded to https.
 */
export function toSafeUrl(
  value: string | null | undefined
): string | undefined {
  const url = value?.trim()
  if (!url) {
    return undefined
  }
  if (url.startsWith('//')) {
    return toSafeUrl(`https:${url}`)
  }
  if (url.startsWith('/')) {
    // Browsers read "/\host" as "//host"
    return url.startsWith('/\\') ? undefined : url
  }
  try {
    return SAFE_PROTOCOLS.has(new URL(url).protocol) ? url : undefined
  } catch {
    return undefined
  }
}
