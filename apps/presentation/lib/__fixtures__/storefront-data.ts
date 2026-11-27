/**
 * config/storefront/storefront-data.json as the storefront's tests see it (jest maps
 * `@shopin/storefront/storefront-data.json` here): the data of the fixture config, not the shop's, so the tests
 * pass whatever config/shop/shopin.config.ts says.
 */
import { FIXTURE_STOREFRONT } from '../variant/__fixtures__/storefront'

export default FIXTURE_STOREFRONT
