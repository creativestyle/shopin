import { DEFAULT_DATA_SOURCE } from '@config/constants'
import { isValidDataSource } from '../validation'
import { DATA_SOURCE_COOKIE_NAME, DATA_SOURCE_HEADER_NAME } from '../constants'

/**
 * Get data source header for outgoing requests
 * This is used by the BFF client to set the X-Data-Source header
 */
export function getDataSourceHeader(
  cookies: string | { get: (name: string) => { value: string } | undefined }
): Record<string, string> {
  let dataSource: string | undefined

  if (typeof cookies === 'string') {
    // Client-side: parse document.cookie string
    const match = cookies.match(
      new RegExp(`${DATA_SOURCE_COOKIE_NAME}=([^;]+)`)
    )
    dataSource = match?.[1]
  } else {
    // Server-side: use Next.js cookie store
    dataSource = cookies.get(DATA_SOURCE_COOKIE_NAME)?.value
  }

  if (dataSource && isValidDataSource(dataSource)) {
    return { [DATA_SOURCE_HEADER_NAME]: dataSource }
  }

  // Default to mock if no valid data source found
  return { [DATA_SOURCE_HEADER_NAME]: DEFAULT_DATA_SOURCE }
}
