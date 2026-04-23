'use client'

import * as React from 'react'
import { createContext, useContext } from 'react'
import type { StoreConfigResponse } from '@core/contracts/store-config/store-config'

interface StoreConfigContextType {
  storeConfig: StoreConfigResponse
}

const StoreConfigContext = createContext<StoreConfigContextType | undefined>(
  undefined
)

export function StoreConfigProvider({
  children,
  storeConfig,
}: {
  children: React.ReactNode
  storeConfig: StoreConfigResponse
}) {
  return (
    <StoreConfigContext.Provider value={{ storeConfig }}>
      {children}
    </StoreConfigContext.Provider>
  )
}

export function useStoreConfig() {
  const context = useContext(StoreConfigContext)
  if (context === undefined) {
    throw new Error('useStoreConfig must be used within a StoreConfigProvider')
  }
  return context
}
