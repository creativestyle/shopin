'use client'

import * as React from 'react'

/**
 * Captures the last focused element before a dialog/sheet opens and
 * restores focus to it on close. Returns `onOpenAutoFocus` and
 * `onCloseAutoFocus` handlers to spread onto a Radix Dialog/Sheet Content.
 *
 * Uses a persistent focus tracker instead of snapshotting `document.activeElement`
 * at mount-time, because the trigger button may become disabled before the sheet
 * opens (e.g. after firing a mutation), which causes the browser to move focus
 * to `document.body`.
 */
export function useFocusRestore() {
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const lastFocusedRef = React.useRef<HTMLElement | null>(null)

  // Continuously track the last focused non-body element.
  // This survives the trigger becoming disabled between click and sheet open.
  React.useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      if (e.target instanceof HTMLElement && e.target !== document.body) {
        lastFocusedRef.current = e.target
      }
    }
    document.addEventListener('focus', handleFocus, true)
    return () => document.removeEventListener('focus', handleFocus, true)
  }, [])

  const onOpenAutoFocus = React.useCallback(() => {
    const active = document.activeElement as HTMLElement | null
    triggerRef.current =
      active && active !== document.body ? active : lastFocusedRef.current
  }, [])

  const onCloseAutoFocus = React.useCallback((event: Event) => {
    if (triggerRef.current && document.contains(triggerRef.current)) {
      event.preventDefault()
      triggerRef.current.focus()
    }
  }, [])

  return { onOpenAutoFocus, onCloseAutoFocus }
}
