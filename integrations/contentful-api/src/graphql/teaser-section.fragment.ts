import { gql } from 'graphql-request'
import { QUERY_LIMITS } from '../constants/query-limits'

export const TeaserSectionFragment = gql`
  fragment TeaserSectionFragment on TeaserSection {
    categoryLabel
    headline
    body
    subcategoryLinkEntriesCollection(limit: ${QUERY_LIMITS.SECTION_SUBCATEGORY_LINKS}) {
      items {
        ... on Link {
          ...LinkEntryFragment
        }
      }
    }
    image {
      ...AssetFragment
    }
  }
`
