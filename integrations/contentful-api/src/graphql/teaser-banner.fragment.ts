import { gql } from 'graphql-request'

export const TeaserBannerFragment = gql`
  fragment TeaserBannerFragment on TeaserBanner {
    headline
    body
    cta {
      ...ButtonEntryFragment
    }
    backgroundImage {
      ...AssetFragment
    }
  }
`
