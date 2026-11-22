'use client'

import { useContext } from 'react'
import { ConsentContext, type ConsentContextValue } from './consent-provider'

/** Access consent state and actions. Must be used within a {@link ConsentProvider}. */
export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext)
  if (context === undefined) {
    throw new Error('useConsent must be used within a ConsentProvider')
  }
  return context
}
