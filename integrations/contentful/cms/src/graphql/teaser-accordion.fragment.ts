import { gql } from 'graphql-request'
import { QUERY_LIMITS } from '../constants/query-limits'

export const TeaserAccordionFragment = gql`
  fragment TeaserAccordionFragment on TeaserAccordion {
    title
    accordion {
      title
      mode
      itemsCollection(limit: ${QUERY_LIMITS.ACCORDION_ITEMS}) {
        items {
          title
          expanded
          body {
            json
          }
        }
      }
    }
  }
`
