// Demo-specific constants for UI components
import type { DataSource } from '@config/constants'
export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  'mock-set': 'Mock',
  'commercetools-set': 'CT',
  'commercetools-algolia-set': 'CT + Algolia',
}

export const DATA_SOURCE_COLORS: Record<DataSource, string> = {
  'mock-set': '#eab308',
  'commercetools-set': '#3b82f6',
  'commercetools-algolia-set': '#9333ea',
}
