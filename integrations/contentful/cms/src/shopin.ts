import { defineIntegration } from '@core/integration-kit'
import { CONTENTFUL_IMAGE_API_HOSTS } from './image-hosts'
import { contentfulEnv } from './env'

export const contentful = () =>
  defineIntegration({
    id: 'contentful',
    label: {
      en: 'Contentful: pages and navigation from the space',
      de: 'Contentful: Seiten und Navigation aus dem Space',
    },
    env: { cms: contentfulEnv },
    // lazy: a port's Nest module and SDK load only when the config chooses it
    /* eslint-disable @typescript-eslint/no-require-imports */
    ports: { cms: () => (require('./bff') as typeof import('./bff')).default },
    storefront: {
      // Contentful Images API: ?w=<width>&q=<quality>&fm=webp
      contentImages: {
        hosts: CONTENTFUL_IMAGE_API_HOSTS,
        resize: {
          kind: 'query',
          width: 'w',
          quality: 'q',
          fixed: { fm: 'webp' },
        },
      },
    },
  })
