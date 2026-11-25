export const GRAPHQL_CLIENT = 'GRAPHQL_CLIENT'
export const CONTENTFUL_TOKENS = 'CONTENTFUL_TOKENS'

export interface ContentfulTokens {
  space: string
  environment: string
  accessToken: string
  /** Set for Contentful preview (draft content). Required when calling with preview: true. */
  previewAccessToken?: string
}
