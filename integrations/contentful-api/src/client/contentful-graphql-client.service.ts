import { Injectable, Inject, ServiceUnavailableException } from '@nestjs/common'
import type { RequestDocument } from 'graphql-request'
import type { GraphQLClient } from 'graphql-request'
import {
  GRAPHQL_CLIENT,
  CONTENTFUL_TOKENS,
  type ContentfulTokens,
} from './graphql-client.tokens'

export interface ContentfulRequestOptions {
  preview?: boolean
}

/**
 * Centralized GraphQL client for Contentful. Picks delivery vs preview token
 * based on options.preview so services only pass the flag and never touch tokens.
 */
@Injectable()
export class ContentfulGraphQLClientService {
  constructor(
    @Inject(GRAPHQL_CLIENT) private readonly client: GraphQLClient,
    @Inject(CONTENTFUL_TOKENS) private readonly tokens: ContentfulTokens
  ) {}

  async request<T>(
    document: RequestDocument,
    variables?: Record<string, unknown>,
    options?: ContentfulRequestOptions
  ): Promise<T> {
    const preview = options?.preview === true
    if (preview && !this.tokens.previewAccessToken) {
      throw new ServiceUnavailableException(
        'Content preview is not configured. Set CONTENTFUL_PREVIEW_ACCESS_TOKEN so the BFF can use the Contentful Preview API for draft content.'
      )
    }
    const token = preview
      ? this.tokens.previewAccessToken!
      : this.tokens.accessToken
    return this.client.request<T>(document, variables, {
      authorization: `Bearer ${token}`,
    })
  }
}
