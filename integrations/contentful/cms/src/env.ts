import type { PortOptions } from '@core/integration-kit'

/** Env of the Contentful cms part (read by the BFF, handed over as options). */
export const contentfulEnv = {
  space: { env: 'CONTENTFUL_SPACE' },
  environment: { env: 'CONTENTFUL_ENVIRONMENT', default: 'master' },
  accessToken: { env: 'CONTENTFUL_ACCESS_TOKEN' },
  previewAccessToken: {
    env: 'CONTENTFUL_PREVIEW_ACCESS_TOKEN',
    optional: true,
  },
} as const
export type ContentfulOptions = PortOptions.Of<typeof contentfulEnv>
