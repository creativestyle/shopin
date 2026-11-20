'use client'

import { useSelectedLayoutSegments } from 'next/navigation'

const LEGAL_SEGMENTS = new Set(['privacy', 'imprint', 'terms'])

/** True on legal pages, which blocking first-visit modals must leave readable. */
export function useIsLegalRoute(): boolean {
  const segments = useSelectedLayoutSegments()
  // Segments include route groups (e.g. "(main)"), so skip them.
  const firstSegment = segments?.find((s) => !s.startsWith('('))
  return firstSegment !== undefined && LEGAL_SEGMENTS.has(firstSegment)
}
