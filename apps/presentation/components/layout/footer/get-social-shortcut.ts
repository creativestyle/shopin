import type { CmsLinkResponse } from '@core/contracts/content/cms-link'

const SOCIAL_SHORTCUTS: Record<string, string> = {
  facebook: 'Fb',
  instagram: 'Ig',
  twitter: 'X',
  x: 'X',
  linkedin: 'In',
  youtube: 'Yt',
  tiktok: 'Tk',
  pinterest: 'Pi',
  snapchat: 'Sc',
  whatsapp: 'Wa',
  telegram: 'Tg',
  vimeo: 'Vm',
}

function getShortcutFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    const base = host.split('.')[0]?.toLowerCase() ?? ''
    return SOCIAL_SHORTCUTS[base] ?? base.slice(0, 2).toUpperCase()
  } catch {
    return ''
  }
}

function getShortcutFromLabel(label: string): string {
  const labelLower = label.toLowerCase()
  for (const [key, shortcut] of Object.entries(SOCIAL_SHORTCUTS)) {
    if (labelLower.includes(key)) {
      return shortcut
    }
  }
  return label.slice(0, 2).toUpperCase()
}

export function getSocialShortcut(link: CmsLinkResponse): string {
  if (link.url) {
    const fromUrl = getShortcutFromUrl(link.url)
    if (fromUrl) {
      return fromUrl
    }
  }
  return getShortcutFromLabel(link.label)
}
