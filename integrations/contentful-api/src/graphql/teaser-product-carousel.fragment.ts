import { gql } from 'graphql-request'

export const TeaserProductCarouselFragment = gql`
  fragment TeaserProductCarouselFragment on TeaserProductCarousel {
    title
    categorySlug
  }
`
