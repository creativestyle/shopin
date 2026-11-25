import { gql } from 'graphql-request'

/** Shared link fields used in Button, teaser CTAs, and footer/header links. */
export const LinkEntryFragment = gql`
  fragment LinkEntryFragment on Link {
    label
    url
    ariaLabel
    rel
    title
    noFollow
    noIndex
    target
  }
`
