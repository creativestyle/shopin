import { Injectable, Inject, Scope } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import type { Request } from 'express'
import {
  DEFAULT_COOKIE_PATH,
  DEFAULT_COOKIE_SAME_SITE,
  COOKIE_CLEAR_MAX_AGE,
} from '@config/constants'
import type { CookieOptions } from '..'

/**
 * Base cookie service providing common cookie operations
 * Follows Single Responsibility Principle - only handles cookie management
 * Follows DRY principle - eliminates duplication across services
 */
@Injectable({
  scope: Scope.REQUEST,
})
export class CookieService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  /**
   * Creates cookie options with default values
   * @param maxAge - Maximum age in milliseconds
   * @param overrides - Optional overrides for default cookie options
   * @returns Cookie options object
   */
  createCookieOptions(
    maxAge: number,
    overrides?: Partial<CookieOptions>
  ): CookieOptions {
    return {
      httpOnly: true,
      secure: true,
      sameSite: DEFAULT_COOKIE_SAME_SITE,
      maxAge,
      path: DEFAULT_COOKIE_PATH,
      ...overrides,
    }
  }

  /**
   * Creates cookie options for clearing cookies
   * @param overrides - Optional overrides for default cookie options
   * @returns Cookie options object with maxAge set to 0
   */
  createClearCookieOptions(overrides?: Partial<CookieOptions>): CookieOptions {
    return this.createCookieOptions(COOKIE_CLEAR_MAX_AGE, overrides)
  }

  /**
   * Ensures the request cookies object exists
   */
  ensureCookiesObject(): void {
    if (!this.request.cookies) {
      this.request.cookies = {}
    }
  }

  /**
   * Sets a cookie in the response
   * @param name - Cookie name
   * @param value - Cookie value
   * @param options - Cookie options
   * @param encodeValue - Whether to encode the value (default: false)
   */
  setCookie(
    name: string,
    value: string,
    options: CookieOptions,
    encodeValue: boolean = false
  ): void {
    if (!this.hasResponse() || !this.hasCookieFunction()) {
      return
    }

    const finalValue = encodeValue ? encodeURIComponent(value) : value
    this.request.res!.cookie(name, finalValue, options)
    this.ensureCookiesObject()
    // Override request cookie to ensure immediate access within the same request cycle.
    // The response cookie will be sent to the client, but updating request.cookies
    // allows code reading cookies during this request to see the newly set value.
    this.request.cookies![name] = finalValue
  }

  /**
   * Clears a cookie from the response
   * @param name - Cookie name
   * @param options - Optional cookie options (defaults to clear options)
   */
  clearCookie(name: string, options?: CookieOptions): void {
    if (!this.hasResponse() || !this.hasClearCookieFunction()) {
      if (this.request.cookies) {
        delete this.request.cookies[name]
      }
      return
    }

    const clearOptions = options || this.createClearCookieOptions()
    this.request.res!.clearCookie(name, clearOptions)
    if (this.request.cookies) {
      delete this.request.cookies[name]
    }
  }

  /**
   * Checks if a cookie exists in the request
   * @param name - Cookie name
   * @returns true if cookie exists, false otherwise
   */
  hasCookie(name: string): boolean {
    return !!this.request.cookies?.[name]
  }

  /**
   * Gets a cookie value from the request
   * @param name - Cookie name
   * @param decodeValue - Whether to decode the value (default: false)
   * @returns Cookie value or undefined if not found
   */
  getCookie(name: string, decodeValue: boolean = false): string | undefined {
    if (!this.hasCookie(name)) {
      return undefined
    }

    const value = this.request.cookies![name]

    if (!decodeValue) {
      return value
    }

    try {
      const decoded = decodeURIComponent(value)
      // Return undefined for empty strings after decoding
      return decoded.trim() || undefined
    } catch {
      // If decoding fails, return undefined
      return undefined
    }
  }

  /**
   * Gets all cookie names from the request
   * @returns Array of cookie names
   */
  getAllCookieNames(): string[] {
    return Object.keys(this.request.cookies || {})
  }

  /**
   * Checks if response object exists
   */
  private hasResponse(): boolean {
    return !!this.request.res
  }

  /**
   * Checks if cookie function exists on response
   */
  private hasCookieFunction(): boolean {
    return !!this.request.res && typeof this.request.res.cookie === 'function'
  }

  /**
   * Checks if clearCookie function exists on response
   */
  private hasClearCookieFunction(): boolean {
    return (
      !!this.request.res && typeof this.request.res.clearCookie === 'function'
    )
  }
}
