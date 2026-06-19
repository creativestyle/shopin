export function isHostSupported(
  url: string,
  hosts: readonly string[]
): boolean {
  try {
    const absolute = url.startsWith('//') ? `https:${url}` : url
    const host = new URL(absolute).hostname
    return hosts.some((h) => host === h || host.endsWith('.' + h))
  } catch {
    return false
  }
}
