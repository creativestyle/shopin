import type { BffFetchClient } from '../types'
import { CSRF_TOKEN_HEADER_NAME } from '@config/constants'
import { getCsrfToken } from '../utils/csrf-token'
import { RateLimitError } from '../utils/rate-limit-error'

type ServiceRequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  next?: {
    revalidate?: number
    tags?: string[]
  }
  /**
   * Query parameters to append to the URL path.
   * Values will be properly encoded. Undefined/null values are omitted.
   */
  queryParams?: Record<string, string | number | boolean | null | undefined>
  /**
   * Custom error handler. If provided, called when response is not ok.
   * Can return a value (to handle error gracefully) or throw an error.
   */
  onError?: (response: Response) => Promise<unknown> | unknown
  /**
   * Custom handler for network/parsing errors. If provided, called when fetch fails
   * or JSON parsing fails. Can return a value (to handle error gracefully) or throw an error.
   */
  onNetworkError?: (error: Error) => Promise<unknown> | unknown
  /**
   * If true, allows empty responses (no content) to return null instead of throwing.
   * Useful for endpoints that may legitimately return empty responses.
   */
  allowEmpty?: boolean
}

/**
 * Base service class that provides common HTTP methods with automatic CSRF token handling
 * All service classes should extend this base class
 */
export abstract class BaseService {
  private csrfToken: string | null = null
  private csrfTokenPromise: Promise<string> | null = null

  constructor(protected bffFetch: BffFetchClient) {}

  /**
   * Build URL from path and query parameters
   * @param path - Base path
   * @param queryParams - Optional query parameters object
   * @returns URL string with query string appended if queryParams provided
   */
  protected buildUrl(
    path: string,
    queryParams?: Record<string, string | number | boolean | null | undefined>
  ): string {
    if (!queryParams) {
      return path
    }

    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== null && value !== undefined) {
        params.append(key, String(value))
      }
    }

    const queryString = params.toString()
    return queryString ? `${path}?${queryString}` : path
  }

  /**
   * Get or fetch CSRF token, using cache if available.
   * Handles concurrent requests to avoid race conditions.
   */
  private async getCsrfToken(): Promise<string> {
    // Return cached token if available
    if (this.csrfToken) {
      return this.csrfToken
    }

    // If a fetch is already in progress, wait for it
    if (this.csrfTokenPromise) {
      return this.csrfTokenPromise
    }

    // Start a new fetch and cache the promise
    this.csrfTokenPromise = getCsrfToken(this.bffFetch)
      .then((token) => {
        this.csrfToken = token
        this.csrfTokenPromise = null
        return token
      })
      .catch((error) => {
        // Clear promise on error so next call can retry
        this.csrfTokenPromise = null
        throw error
      })

    return this.csrfTokenPromise
  }

  /**
   * Handle response and return parsed JSON or handle errors
   */
  private async handleResponse<T>(
    res: Response,
    options?: ServiceRequestOptions
  ): Promise<T> {
    if (!res.ok) {
      if (options?.onError) {
        return (await options.onError(res)) as T
      }

      if (res.status === 429) {
        throw new RateLimitError()
      }

      throw new Error(`${res.status} ${res.statusText}`)
    }

    if (options?.allowEmpty) {
      const contentType = res.headers.get('content-type')
      const contentLength = res.headers.get('content-length')

      if (contentLength === '0' || !contentType?.includes('application/json')) {
        return null as T
      }
    }

    return await res.json()
  }

  /**
   * Execute a fetch request with error handling
   */
  private async executeRequest<T>(
    method: string,
    path: string,
    body: unknown,
    options?: ServiceRequestOptions & { needsCsrf?: boolean }
  ): Promise<T> {
    try {
      let headers: Record<string, string> = {
        ...(options?.headers as Record<string, string> | undefined),
      }

      // Add CSRF token if needed
      if (options?.needsCsrf) {
        const csrfToken = await this.getCsrfToken()
        headers[CSRF_TOKEN_HEADER_NAME] = csrfToken
      }

      // Build URL with query parameters
      const url = this.buildUrl(path, options?.queryParams)

      const res = await this.bffFetch.fetch(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers,
        ...options,
      })

      // Handle 403 Forbidden - token might be expired, try refetching and retry once
      if (res.status === 403 && options?.needsCsrf) {
        this.csrfToken = null
        this.csrfTokenPromise = null
        headers[CSRF_TOKEN_HEADER_NAME] = await this.getCsrfToken()

        const retryRes = await this.bffFetch.fetch(url, {
          method,
          body: body ? JSON.stringify(body) : undefined,
          headers,
          ...options,
        })

        return await this.handleResponse<T>(retryRes, options)
      }

      const result = await this.handleResponse<T>(res, options)

      // Clear CSRF token after successful mutation (tokens are single-use)
      if (options?.needsCsrf && res.ok) {
        this.csrfToken = null
        this.csrfTokenPromise = null
      }

      return result
    } catch (error) {
      if (options?.onNetworkError) {
        return (await options.onNetworkError(
          error instanceof Error ? error : new Error(String(error))
        )) as T
      }
      throw error
    }
  }

  /**
   * GET request - no CSRF token needed
   */
  protected async get<T>(
    path: string,
    options?: ServiceRequestOptions
  ): Promise<T> {
    return await this.executeRequest<T>('GET', path, undefined, options)
  }

  /**
   * POST request - automatically includes CSRF token
   */
  protected async post<T>(
    path: string,
    body?: unknown,
    options?: ServiceRequestOptions
  ): Promise<T> {
    return await this.executeRequest<T>('POST', path, body, {
      ...options,
      needsCsrf: true,
    })
  }

  /**
   * PUT request - automatically includes CSRF token
   */
  protected async put<T>(
    path: string,
    body?: unknown,
    options?: ServiceRequestOptions
  ): Promise<T> {
    return await this.executeRequest<T>('PUT', path, body, {
      ...options,
      needsCsrf: true,
    })
  }

  /**
   * DELETE request - automatically includes CSRF token
   */
  protected async delete<T>(
    path: string,
    body?: unknown,
    options?: ServiceRequestOptions
  ): Promise<T> {
    return await this.executeRequest<T>('DELETE', path, body, {
      ...options,
      needsCsrf: true,
    })
  }
}
