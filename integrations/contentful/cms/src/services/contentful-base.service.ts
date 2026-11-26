import type { RequestDocument } from 'graphql-request'
import { I18N_CONFIG } from '@config/constants'
import { ContentfulGraphQLClientService } from '../client/contentful-graphql-client.service'

/**
 * Base for Contentful-backed services. Applies shared locale fallback and a single
 * `preview` flag for both GraphQL variables and client options (token selection).
 */
export abstract class ContentfulBaseService {
  constructor(protected readonly contentful: ContentfulGraphQLClientService) {}

  /** Resolves locale for Contentful; empty/falsy values fall back to default language. */
  protected resolveLocale(locale: string): string {
    return locale || I18N_CONFIG.defaultLocale
  }

  /**
   * Runs a Contentful GraphQL request with locale fallback and preview handling.
   * Pass `preview` once; it is forwarded to query variables and to client options (token).
   */
  protected async request<T>(
    document: RequestDocument,
    variables: Record<string, unknown> = {},
    preview = false
  ): Promise<T> {
    const vars = { ...variables }
    if ('locale' in vars && typeof vars.locale === 'string') {
      vars.locale = this.resolveLocale(vars.locale)
    }
    vars.preview = preview
    return this.contentful.request<T>(document, vars, { preview })
  }
}
