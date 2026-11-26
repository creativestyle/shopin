import { gql } from 'graphql-request'

export const TeaserHeadlineFragment = gql`
  fragment TeaserHeadlineFragment on TeaserHeadline {
    headline
    subtext
    cta {
      ...ButtonEntryFragment
    }
  }
`
