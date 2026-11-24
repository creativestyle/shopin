import { PREVIEW_ACTIVE_COOKIE } from '@config/constants'

/** Set on <html> while a draft session is active; CSS shows the banner from it before first paint. */
export const DRAFT_SESSION_ATTRIBUTE = 'data-draft-session'

const MARKER = `${PREVIEW_ACTIVE_COOKIE}=1`

export function hasDraftMarkerCookie(cookie: string): boolean {
  return cookie.split('; ').includes(MARKER)
}

/** Inline <head> script: runs during HTML parsing, so cached pages paint with the banner in place. */
export const DRAFT_SESSION_SCRIPT = `(function(){try{if(document.cookie.split('; ').indexOf(${JSON.stringify(MARKER)})>-1)document.documentElement.setAttribute(${JSON.stringify(DRAFT_SESSION_ATTRIBUTE)},'')}catch(e){}})()`
