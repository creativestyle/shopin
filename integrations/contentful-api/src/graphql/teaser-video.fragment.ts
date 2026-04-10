import { gql } from 'graphql-request'

export const TeaserVideoFragment = gql`
  fragment TeaserVideoFragment on TeaserVideo {
    __typename
    title
    video {
      ...AssetFragment
    }
    thumbnail {
      ...AssetFragment
    }
    autoplay
    controls
    caption
    link {
      ...LinkEntryFragment
    }
  }
`
