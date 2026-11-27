import { defineConfig } from "@core/integration-kit";
import { mockIdentity } from "@integrations/mock-auth/shopin";
import { mockCms } from "@integrations/mock-cms/shopin";
import { mock } from "@integrations/mock-commerce/shopin";
import { mockPsp } from "@integrations/mock-psp/shopin";

/**
 * Per category, the integration that serves it. `npm run use <category> <integration>` (e.g. `npm run use cms
 * contentful`) writes the import and the line and runs `npm run setup`, which installs exactly these integrations
 * and lists their variables in .env; then restart. After a change by hand: `npm run setup`. This shop runs on mock
 * data: no account, no variable to set. With no search integration, search is the commerce integration's own
 * product search. The SHOPin demo (commercetools, Contentful, Algolia, the /setup selector) is demo/shop:
 * `npm run use demo` points this file at it, `npm run use demo off` back.
 */
export const config = defineConfig({
  commerce: mock(),
  cms: mockCms(),
  psp: mockPsp(),
  auth: mockIdentity(),
});
