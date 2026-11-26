import { defineConfig, defineIntegration, port } from '@core/integration-kit'

/**
 * A shop config whose commerce port throws while the BFF builds it (as a commerce port does for a locale
 * without a store key). main.spec.ts boots the BFF on it through test/boot-error-preload.js.
 */
const broken = defineIntegration({
  id: 'broken',
  label: 'Broken',
  ports: {
    commerce: () =>
      port('commerce', {
        useFactory: () => {
          throw new Error(
            'broken: no store key for fr-FR: add it to broken({ storeKeys })'
          )
        },
      }),
  },
})

export const config = defineConfig({ commerce: broken })
