import { gql } from 'graphql-request'

export const TeaserImageFragment = gql`
  fragment TeaserImageFragment on TeaserImage {
    title
    image {
      ...AssetFragment
    }
    caption
    link {
      ...LinkEntryFragment
    }
  }
`
