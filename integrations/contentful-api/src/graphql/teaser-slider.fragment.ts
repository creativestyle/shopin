import { gql } from 'graphql-request'
import { QUERY_LIMITS } from '../constants/query-limits'

export const TeaserSliderFragment = gql`
  fragment TeaserSliderFragment on TeaserSlider {
    title
    slidesCollection(limit: ${QUERY_LIMITS.SLIDER_SLIDES}) {
      items {
        ...TeaserCarouselItemFragment
      }
    }
  }
`
