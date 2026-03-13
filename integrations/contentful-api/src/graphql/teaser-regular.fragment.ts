import { gql } from 'graphql-request'

export const TeaserRegularFragment = gql`
  fragment TeaserRegularFragment on TeaserRegular {
    categoryLabel
    headline
    body
    cta {
      ...ButtonEntryFragment
    }
    image {
      ...AssetFragment
    }
  }
`
