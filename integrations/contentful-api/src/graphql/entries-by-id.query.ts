import { gql } from 'graphql-request'

/** Fetch entries by ID; used to resolve rich text entry hyperlinks without increasing page query complexity. */
export const EntriesByIdQuery = gql`
  query EntriesById(
    $ids: [String!]!
    $limit: Int!
    $locale: String!
    $preview: Boolean!
  ) {
    entryCollection(
      where: { sys: { id_in: $ids } }
      locale: $locale
      limit: $limit
      preview: $preview
    ) {
      items {
        __typename
        sys {
          id
        }
        ... on Page {
          slug
        }
        ... on Link {
          url
        }
      }
    }
  }
`
