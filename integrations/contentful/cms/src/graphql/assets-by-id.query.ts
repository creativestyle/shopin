import { gql } from 'graphql-request'

/** Fetch assets by ID; used to resolve rich text embedded assets without increasing page query complexity. */
export const AssetsByIdQuery = gql`
  query AssetsById(
    $ids: [String!]!
    $limit: Int!
    $locale: String!
    $preview: Boolean!
  ) {
    assetCollection(
      where: { sys: { id_in: $ids } }
      locale: $locale
      limit: $limit
      preview: $preview
    ) {
      items {
        sys {
          id
        }
        url
        title
        description
      }
    }
  }
`
