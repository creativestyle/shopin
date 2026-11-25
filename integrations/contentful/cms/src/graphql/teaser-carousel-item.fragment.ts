import { gql } from 'graphql-request'

/** Carousel/slider item (image, caption, link, headline, body, cta). Shared by TeaserCarousel and TeaserSlider. */
export const TeaserCarouselItemFragment = gql`
  fragment TeaserCarouselItemFragment on TeaserCarouselItem {
    image {
      ...AssetFragment
    }
    caption
    link {
      ...LinkEntryFragment
    }
    headline
    body
    cta {
      ...ButtonEntryFragment
    }
  }
`
