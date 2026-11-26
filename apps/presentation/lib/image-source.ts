import type { ImageSource } from '@core/integration-kit'

function hostOf(url: string): string | undefined {
  try {
    return new URL(url.startsWith('//') ? `https:${url}` : url).hostname
  } catch {
    return undefined
  }
}

/** The source whose hosts serve `url` (a host or any of its subdomains). */
export function imageSourceOf(
  url: string,
  sources: readonly ImageSource[]
): ImageSource | undefined {
  const host = hostOf(url)
  if (!host) {
    return undefined
  }
  return sources.find((s) =>
    s.hosts.some((h) => host === h || host.endsWith('.' + h))
  )
}

/** Every host of these sources (next/image remote patterns, preconnect). */
export function imageHosts(sources: readonly ImageSource[]): string[] {
  return [...new Set(sources.flatMap((s) => s.hosts))]
}

/**
 * The URL of `src` at `width`, by its source's resize rule (data an integration declares); unchanged without
 * one. `suffix` inserts a suffix before the extension; `query` appends width (and quality) parameters.
 */
export function resizeImage(
  src: string,
  width: number,
  quality: number,
  source: ImageSource
): string {
  const r = source.resize
  if (!r) {
    return src
  }
  if (r.kind === 'suffix') {
    const suffix = r.steps.find((s) => width <= s.maxWidth)?.suffix ?? r.largest
    // keeps the extension, query and fragment; no-op for extensionless URLs
    return src.replace(/(\.[^./?#]+)(\?[^#]*)?(#.*)?$/, `${suffix}$1$2$3`)
  }
  const params = new URLSearchParams()
  params.set(r.width, String(Math.round(width)))
  if (r.quality) {
    params.set(r.quality, String(quality))
  }
  for (const [k, v] of Object.entries(r.fixed ?? {})) {
    params.set(k, v)
  }
  return `${src}${src.includes('?') ? '&' : '?'}${params.toString()}`
}
