import { gql } from 'graphql-request'

/** Reusable Asset fields for images (teasers, ogImage, etc.). Extend here when more metadata is needed. */
export const AssetFragment = gql`
  fragment AssetFragment on Asset {
    url
    title
    description
    width
    height
  }
`
