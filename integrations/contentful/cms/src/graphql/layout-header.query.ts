import { gql } from 'graphql-request'
import { QUERY_LIMITS } from '../constants/query-limits'

/** Layout header (top bar messages) query. */
export const LayoutHeaderQuery = gql`
  query LayoutHeader($locale: String!, $preview: Boolean!) {
    topBarCollection(
      locale: $locale
      limit: ${QUERY_LIMITS.LAYOUT_COLLECTION}
      preview: $preview
      order: sys_publishedAt_DESC
    ) {
      items {
        topBarMessages
      }
    }
  }
`
