import { gql } from 'graphql-request'

export const TeaserHeroFragment = gql`
  fragment TeaserHeroFragment on TeaserHero {
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
