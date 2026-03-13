import { gql } from 'graphql-request'

export const TeaserTextFragment = gql`
  fragment TeaserTextFragment on TeaserText {
    body
  }
`
