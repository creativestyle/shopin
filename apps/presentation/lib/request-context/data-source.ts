import { cache } from 'react'
import { DEFAULT_DATA_SOURCE, type DataSource } from '@config/constants'

const getHolder = cache((): { value: DataSource | undefined } => ({
  value: undefined,
}))

export function setRequestDataSource(dataSource: DataSource): void {
  getHolder().value = dataSource
}

export function getRequestDataSource(): DataSource {
  const { value } = getHolder()
  if (value === undefined) {
    if (process.env.NODE_ENV === 'development') {
      throw new Error(
        'getRequestDataSource() called before setRequestDataSource(). ' +
          'Ensure the [dataSource]/[locale]/layout.tsx calls setRequestDataSource(dataSource) before any BFF fetches.'
      )
    }
    return DEFAULT_DATA_SOURCE
  }
  return value
}
