import { gql } from 'graphql-request'

/** Button/CTA entry (variant, style, link). Used in teasers. */
export const ButtonEntryFragment = gql`
  fragment ButtonEntryFragment on Button {
    variant
    style
    link {
      ...LinkEntryFragment
    }
  }
`
