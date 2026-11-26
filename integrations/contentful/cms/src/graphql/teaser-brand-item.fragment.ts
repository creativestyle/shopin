import { gql } from 'graphql-request'

/** Brand item (image + caption + link). Used by TeaserBrandFragment. */
export const TeaserBrandItemFragment = gql`
  fragment TeaserBrandItemFragment on TeaserBrandItem {
    image {
      ...AssetFragment
    }
    caption
    link {
      ...LinkEntryFragment
    }
  }
`
