import { defineConfig } from '@core/integration-kit'
import { algolia } from '@integrations/algolia-search/shopin'
import { commercetoolsAuth } from '@integrations/commercetools-auth/shopin'
import { commercetools } from '@integrations/commercetools-commerce/shopin'
import { contentful } from '@integrations/contentful-cms/shopin'
import { mockIdentity } from '@integrations/mock-auth/shopin'
import { mockCms } from '@integrations/mock-cms/shopin'
import { mock } from '@integrations/mock-commerce/shopin'
import { mockPsp } from '@integrations/mock-psp/shopin'
import { providerSwitch } from '@demo/provider-switch'
import { COMMERCE_SEARCH } from '@demo/provider-switch/view'
import { SwitchModule } from '@demo/provider-switch/module'

/**
 * The SHOPin demo (shopin.dev): commercetools, Contentful and mock data side by side, switched per request on
 * /setup (@demo/data-source-selector). `npm run use demo` points shopin.config.ts at it (and storefront.mts at
 * demo/storefront/src/storefront.mts); setup lists the vendors' variables in .env. Search is the product search of
 * this request's commerce provider by default, or Algolia over the commercetools index.
 */
// one instance per integration part: the demo project's store per locale of config/locales.json
const ct = commercetools({
  storeKeys: { 'en-US': 'us-store', 'de-DE': 'eu-store' },
})

// the /setup switcher: per category the integrations to switch between, the first the default
const switched = providerSwitch({
  commerce: [ct, mock()],
  cms: [contentful(), mockCms()],
  auth: [commercetoolsAuth(), mockIdentity()],
  search: [COMMERCE_SEARCH, algolia()],
})

export const config = defineConfig({
  commerce: switched,
  cms: switched,
  psp: mockPsp(),
  auth: switched,
  search: switched,
  features: [SwitchModule],
})
