import {
  DRAFT_SESSION_ATTRIBUTE,
  DRAFT_SESSION_SCRIPT,
  hasDraftMarkerCookie,
} from '../draft-session-marker'

function setCookie(value: string) {
  document.cookie = value
}

function clearCookie(name: string) {
  document.cookie = `${name}=; max-age=0; path=/`
}

describe('draft session marker', () => {
  afterEach(() => {
    clearCookie('preview_active')
    clearCookie('other')
    document.documentElement.removeAttribute(DRAFT_SESSION_ATTRIBUTE)
  })

  it('detects the marker among other cookies', () => {
    expect(hasDraftMarkerCookie('a=1; preview_active=1; b=2')).toBe(true)
  })

  it.each(['', 'preview_active=0', 'preview_active=', 'xpreview_active=1'])(
    'ignores %j',
    (cookie) => {
      expect(hasDraftMarkerCookie(cookie)).toBe(false)
    }
  )

  it('inline script marks <html> when the marker cookie is set', () => {
    setCookie('other=1')
    setCookie('preview_active=1')
    new Function(DRAFT_SESSION_SCRIPT)()
    expect(document.documentElement.hasAttribute(DRAFT_SESSION_ATTRIBUTE)).toBe(
      true
    )
  })

  it('inline script leaves <html> unmarked without the marker cookie', () => {
    setCookie('other=1')
    new Function(DRAFT_SESSION_SCRIPT)()
    expect(document.documentElement.hasAttribute(DRAFT_SESSION_ATTRIBUTE)).toBe(
      false
    )
  })
})
