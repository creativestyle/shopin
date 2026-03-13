/**
 * Client-side cookie utilities for data source management
 */

import type { DataSource } from '@config/constants'
import { isValidDataSource } from '../validation'
import { DATA_SOURCE_COOKIE_NAME } from '../constants'

/**
 * Get data source from client-side cookie
 */
export function getDataSourceFromCookie(): DataSource | null {
  if (typeof document === 'undefined') {
    return null
  }
  const match = document.cookie.match(
    new RegExp(`${DATA_SOURCE_COOKIE_NAME}=([^;]+)`)
  )
  const dataSource = match?.[1] ? decodeURIComponent(match[1]) : undefined
  const isValid = dataSource && isValidDataSource(dataSource)

  return isValid ? (dataSource as DataSource) : null
}

/**
 * Set data source cookie on client-side
 */
export function setDataSourceCookie(dataSource: DataSource): void {
  if (typeof document === 'undefined' || !isValidDataSource(dataSource)) {
    return
  }

  const expiryDate = new Date()
  expiryDate.setFullYear(expiryDate.getFullYear() + 1)

  document.cookie = `${DATA_SOURCE_COOKIE_NAME}=${dataSource}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`
}
