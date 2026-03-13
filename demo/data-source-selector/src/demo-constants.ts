// Demo-specific constants for UI components
import type { DataSource } from '@config/constants'
export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  'mock-set': 'Mock',
  'commercetools-set': 'CT',
}

export const DATA_SOURCE_DESCRIPTIONS: Record<DataSource, string> = {
  'mock-set': 'Use mock data for development and testing',
  'commercetools-set': 'Use Commercetools API for product data',
}

export const DATA_SOURCE_COLORS: Record<DataSource, string> = {
  'mock-set': '#eab308',
  'commercetools-set': '#3b82f6',
}
