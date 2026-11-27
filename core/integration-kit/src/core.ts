/**
 * The integration kit's core entry (`@core/integration-kit/core`): what the BFF, the storefront build, setup and
 * packages that serve through others read. Its types sit under the `shopin-framework` export condition, so an
 * integration or a shop gets none; it may change in any release.
 */
export * from './core/catalog'
export * from './core/resolve'
export * from './core/rules'
export * from './core/env'
export * from './core/load-ports'
export * from './core/storefront-data'
