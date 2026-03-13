import type { NextFunction, Request, Response } from 'express'
import type { DataSource } from '@config/constants'
import { DEFAULT_DATA_SOURCE } from '@config/constants'
import { isValidDataSource } from './validation'
import { DATA_SOURCE_HEADER_NAME } from './constants'

export interface DataSourceRequest extends Request {
  dataSource: DataSource
}

/**
 * Demo middleware that reads x-data-source header
 * This is demo-specific functionality for switching data sources via headers
 */
export function dataSourceHeaderMiddleware(
  req: DataSourceRequest,
  res: Response,
  next: NextFunction
) {
  const headerValue = req.headers[DATA_SOURCE_HEADER_NAME]
  const dataSource = headerValue?.toString().trim().toLowerCase() || ''

  req.dataSource = isValidDataSource(dataSource)
    ? (dataSource as DataSource)
    : DEFAULT_DATA_SOURCE

  next()
}
