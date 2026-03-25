import { gql } from 'graphql-request'
import { QUERY_LIMITS } from '../constants/query-limits'

export const TeaserBrandFragment = gql`
  fragment TeaserBrandFragment on TeaserBrand {
    __typename
    title
    brandItemsCollection(limit: ${QUERY_LIMITS.BRAND_ITEMS}) {
      items {
        ...TeaserBrandItemFragment
      }
    }
  }
`
