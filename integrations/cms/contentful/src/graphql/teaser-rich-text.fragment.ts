import { gql } from 'graphql-request'

/** Rich text json only; links are resolved via separate AssetsByIdQuery and injected in page.service. */
export const TeaserRichTextFragment = gql`
  fragment TeaserRichTextFragment on TeaserRichText {
    title
    richText {
      json
    }
  }
`
