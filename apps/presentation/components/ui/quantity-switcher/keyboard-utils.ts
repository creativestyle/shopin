import type { KeyboardEvent } from 'react'

const ALLOWED_KEYS = [
  'Backspace',
  'Delete',
  'Tab',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
] as const

const ALLOWED_MODIFIER_COMBOS = ['a', 'c', 'v', 'x'] as const

/**
 * Handles keyboard input for numeric-only fields
 * Allows navigation keys, modifier key combinations, and numeric input
 * Prevents non-numeric characters
 *
 * @param e - Keyboard event
 * @param customHandler - Optional handler for special keys (Enter, Escape, etc.)
 *                        Should return true if the event was handled
 */
export function handleNumericKeyDown(
  e: KeyboardEvent<HTMLInputElement>,
  customHandler?: (e: KeyboardEvent<HTMLInputElement>) => boolean | void
): void {
  // Let custom handler process special keys first (Enter, Escape)
  if (customHandler) {
    const wasHandled = customHandler(e)
    if (wasHandled || e.defaultPrevented) {
      return
    }
  }

  // Allow navigation and editing keys
  if (ALLOWED_KEYS.includes(e.key as (typeof ALLOWED_KEYS)[number])) {
    return
  }

  // Allow Ctrl/Cmd + A, C, V, X
  if (e.ctrlKey || e.metaKey) {
    if (
      ALLOWED_MODIFIER_COMBOS.includes(
        e.key.toLowerCase() as (typeof ALLOWED_MODIFIER_COMBOS)[number]
      )
    ) {
      return
    }
  }

  // Only allow numeric keys
  if (!/^\d$/.test(e.key)) {
    e.preventDefault()
  }
}
