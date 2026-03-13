import { ALLOWED_DATA_SOURCES } from '@config/constants'
import type { DataSource } from '@config/constants'

/**
 * Validates if a string value is a valid DataSource
 */
export function isValidDataSource(value: string): value is DataSource {
  return ALLOWED_DATA_SOURCES.includes(value as DataSource)
}
