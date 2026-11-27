/**
 * The integration kit's author API: what an integration declares (`defineIntegration`, `port`) and what a shop
 * writes (`defineConfig`, `StorefrontSlots`). The BFF and the storefront build also read
 * `@core/integration-kit/core`, whose types only framework packages get (the `shopin-framework` export condition).
 */
export * from './author/categories'
export * from './author/port-types'
export * from './author/port'
export * from './author/injectables'
export * from './author/descriptor'
export * from './author/config'
export * from './author/storefront'
