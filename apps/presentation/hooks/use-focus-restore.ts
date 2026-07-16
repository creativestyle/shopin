'use client'

import * as React from 'react'

// Module-level focus tracker — always active, survives conditionally-mounted dialogs.
let lastFocusedElement: HTMLElement | null = null

if (typeof document !== 'undefined') {
  document.addEventListener(
    'focus',
    (e: FocusEvent) => {
      if (e.target instanceof HTMLElement && e.target !== document.body) {
        lastFocusedElement = e.target
      }
    },
    true
  )
}

/**
 * Focus-restore handlers for Radix Dialog/Sheet Content. Uses a module-level
 * tracker that survives conditionally-mounted dialogs and disabled triggers.
 *
 * @param openerRef - Preferred restore target on touch (where tapping doesn't
 *   move focus). Falls back to the module-level tracker when omitted.
 */
export function useFocusRestore(
  openerRef?: React.RefObject<HTMLElement | null>
) {
  const triggerRef = React.useRef<HTMLElement | null>(null)

  const onOpenAutoFocus = React.useCallback(() => {
    const active = document.activeElement as HTMLElement | null
    triggerRef.current =
      active && active !== document.body
        ? active
        : (openerRef?.current ?? lastFocusedElement)
  }, [openerRef])

  const onCloseAutoFocus = React.useCallback((event: Event) => {
    if (triggerRef.current && document.contains(triggerRef.current)) {
      event.preventDefault()
      triggerRef.current.focus()
    }
  }, [])

  return { onOpenAutoFocus, onCloseAutoFocus }
}
