import { gql } from 'graphql-request'
import { QUERY_LIMITS } from '../constants/query-limits'

export const TeaserCarouselFragment = gql`
  fragment TeaserCarouselFragment on TeaserCarousel {
    title
    carouselItemsCollection(limit: ${QUERY_LIMITS.CAROUSEL_ITEMS}) {
      items {
        ...TeaserCarouselItemFragment
      }
    }
  }
`
