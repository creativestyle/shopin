import { describe, it } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RuleTester } from "eslint";
import typescriptEslint from "typescript-eslint";
import {
  integrationBoundaries,
  noIntegrationImports,
  noRelativeIntegrationPath,
  integrationImportException,
} from "../rules/boundaries.js";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const repo = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures/repo",
);
const commerce = (file) => path.join(repo, "integrations/commerce/acme", file);
const app = (file) => path.join(repo, "apps/web", file);
const core = (file) => path.join(repo, "core/thing", file);

const ruleTester = new RuleTester({
  languageOptions: {
    parser: typescriptEslint.parser,
    ecmaVersion: "latest",
    sourceType: "module",
  },
});

ruleTester.run("integration-boundaries", integrationBoundaries, {
  valid: [
    // its own files, relative, from any depth
    {
      filename: commerce("src/services/cart.ts"),
      code: "import { client } from '../client'",
    },
    {
      filename: commerce("src/index.ts"),
      code: "export * from './services/cart'",
    },
    {
      filename: commerce("src/__tests__/cart.spec.ts"),
      code: "import { CartService } from '..'",
    },
    // its own package by name
    {
      filename: commerce("src/x.ts"),
      code: "import { a } from '@integrations/commerce-acme'",
    },
    // shared code and vendor SDKs
    {
      filename: commerce("src/x.ts"),
      code: "import type { Cart } from '@core/contracts/cart/cart'",
    },
    {
      filename: commerce("src/x.ts"),
      code: "import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk'",
    },
    {
      filename: commerce("src/x.ts"),
      code: "import { Injectable } from '@nestjs/common'",
    },
    { filename: commerce("src/x.ts"), code: "import path from 'node:path'" },
    // outside integration packages the rule does nothing
    {
      filename: app("src/x.ts"),
      code: "import { CartService } from '@integrations/commerce-acme'",
    },
    {
      filename: app("src/x.ts"),
      code: "import { a } from '../../../core/thing/src/a'",
    },
    {
      filename: core("src/x.ts"),
      code: "import { CartService } from '@integrations/commerce-acme'",
    },
  ],
  invalid: [
    // another integration, in every import form
    {
      filename: commerce("src/x.ts"),
      code: "import { LoginService } from '@integrations/auth-acme'",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "import type { LoginService } from '@integrations/auth-acme/dist/login'",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "export * from '@integrations/auth-acme'",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "export { LoginService } from '@integrations/auth-acme'",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "const auth = await import('@integrations/auth-acme')",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "const auth = require('@integrations/auth-acme')",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "import auth = require('@integrations/auth-acme')",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "type Login = import('@integrations/auth-acme').LoginService",
      errors: [{ messageId: "otherIntegration" }],
    },
    // app, demo and test code
    {
      filename: commerce("src/x.ts"),
      code: "import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'",
      errors: [{ messageId: "appCode" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "import { DataSourceSelector } from '@demo/data-source-selector'",
      errors: [{ messageId: "appCode" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "import { fixture } from '@test/e2e/fixtures'",
      errors: [{ messageId: "appCode" }],
    },
    // relative paths that leave the package
    {
      filename: commerce("src/x.ts"),
      code: "import { LoginService } from '../../../auth/acme/src/login'",
      errors: [{ messageId: "relativeEscape" }],
    },
    {
      filename: commerce("src/services/cart.ts"),
      code: "import { LanguageProvider } from '../../../../../apps/web/src/language'",
      errors: [{ messageId: "relativeEscape" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "import pkg from '../../package.json'",
      errors: [{ messageId: "relativeEscape" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "export * from '../../mock/src'",
      errors: [{ messageId: "relativeEscape" }],
    },
    // several problems in one file are each reported
    {
      filename: commerce("src/x.ts"),
      code: [
        "import { LoginService } from '@integrations/auth-acme'",
        "import type { LanguageProvider } from '@apps/bff/src/language'",
        "import { other } from '../../../auth/acme/src/other'",
      ].join("\n"),
      errors: [
        { messageId: "otherIntegration" },
        { messageId: "appCode" },
        { messageId: "relativeEscape" },
      ],
    },
  ],
});

const allowWiring = {
  allow: {
    "@apps/web": {
      "src/data-source/wiring.ts": [
        "@integrations/commerce-acme",
        "@integrations/auth-acme",
      ],
    },
  },
};

ruleTester.run("no-integration-imports", noIntegrationImports, {
  valid: [
    // shared packages and the app's own files
    {
      filename: app("src/x.ts"),
      code: "import { a } from '@core/contracts/cart/cart'",
    },
    { filename: app("src/x.ts"), code: "import { a } from './local'" },
    {
      filename: app("src/x.ts"),
      code: "import { Injectable } from '@nestjs/common'",
    },
    // exactly the packages the allow list names for exactly that file
    {
      filename: app("src/data-source/wiring.ts"),
      code: "import { CommerceModule } from '@integrations/commerce-acme'\nimport { AuthModule } from '@integrations/auth-acme'",
      options: [allowWiring],
    },
    // the rule leaves integration packages to integration-boundaries
    {
      filename: commerce("src/x.ts"),
      code: "import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk'",
    },
  ],
  invalid: [
    // an integration package, in every import form
    {
      filename: app("src/x.ts"),
      code: "import { CartService } from '@integrations/commerce-acme'",
      errors: [{ messageId: "integration" }],
    },
    {
      filename: app("src/x.ts"),
      code: "import type { CartService } from '@integrations/commerce-acme'",
      errors: [{ messageId: "integration" }],
    },
    {
      filename: app("src/x.ts"),
      code: "export * from '@integrations/commerce-acme'",
      errors: [{ messageId: "integration" }],
    },
    {
      filename: app("src/x.ts"),
      code: "const m = await import('@integrations/commerce-acme')",
      errors: [{ messageId: "integration" }],
    },
    {
      filename: app("src/x.ts"),
      code: "const m = require('@integrations/commerce-acme')",
      errors: [{ messageId: "integration" }],
    },
    {
      filename: app("src/x.ts"),
      code: "type C = import('@integrations/commerce-acme').CartService",
      errors: [{ messageId: "integration" }],
    },
    {
      filename: core("src/x.ts"),
      code: "import { CartService } from '@integrations/commerce-acme'",
      errors: [{ messageId: "integration" }],
    },
    // the allow list is per file: another file gets nothing
    {
      filename: app("src/features/cart.ts"),
      code: "import { CommerceModule } from '@integrations/commerce-acme'",
      options: [allowWiring],
      errors: [{ messageId: "integration" }],
    },
    // and per package: the listed file gets only the packages listed for it
    {
      filename: app("src/data-source/wiring.ts"),
      code: "import { SearchModule } from '@integrations/search-acme'",
      options: [allowWiring],
      errors: [{ messageId: "integration" }],
    },
    // and per package: the same file path in another package gets nothing
    {
      filename: core("src/data-source/wiring.ts"),
      code: "import { CommerceModule } from '@integrations/commerce-acme'",
      options: [allowWiring],
      errors: [{ messageId: "integration" }],
    },
    // vendor SDKs: never, not even in an allowed file
    {
      filename: app("src/x.ts"),
      code: "import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk'",
      errors: [{ messageId: "vendor" }],
    },
    {
      filename: app("src/x.ts"),
      code: "import { algoliasearch } from 'algoliasearch'",
      errors: [{ messageId: "vendor" }],
    },
    {
      filename: app("src/x.ts"),
      code: "import { BLOCKS } from '@contentful/rich-text-types'",
      errors: [{ messageId: "vendor" }],
    },
    {
      filename: app("src/x.ts"),
      code: "import { createClient } from 'contentful-management'",
      errors: [{ messageId: "vendor" }],
    },
    {
      filename: core("src/x.ts"),
      code: "import { GraphQLClient } from 'graphql-request'",
      errors: [{ messageId: "vendor" }],
    },
    {
      filename: app("src/data-source/wiring.ts"),
      code: "import { ClientBuilder } from '@commercetools/ts-client'",
      options: [allowWiring],
      errors: [{ messageId: "vendor" }],
    },
    // a relative path into an integration package
    {
      filename: app("src/x.ts"),
      code: "import { CartService } from '../../../integrations/commerce/acme/src/cart'",
      errors: [{ messageId: "intoIntegration" }],
    },
  ],
});

ruleTester.run("no-relative-integration-path", noRelativeIntegrationPath, {
  valid: [
    { filename: app("src/x.ts"), code: "import { a } from './cart'" },
    {
      filename: app("src/x.ts"),
      code: "import { a } from '../../core/thing/src/a'",
    },
    // a package name is not a relative path
    {
      filename: app("src/x.ts"),
      code: "import { a } from '@integrations/commerce-acme'",
    },
    {
      filename: commerce("src/x.ts"),
      code: "import { client } from './client/client.module'",
    },
  ],
  invalid: [
    {
      filename: app("src/x.ts"),
      code: "import { a } from '../../../integrations/commerce/acme/src/cart'",
      errors: [{ messageId: "relativeIntegration" }],
    },
    {
      filename: core("src/x.ts"),
      code: "export * from '../../integrations/search/acme'",
      errors: [{ messageId: "relativeIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "import { a } from '../../../auth/acme/src/integration'",
      errors: [{ messageId: "relativeIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "const a = require('../../Integrations/x')",
      errors: [{ messageId: "relativeIntegration" }],
    },
    {
      filename: app("src/x.ts"),
      code: "const a = await import('./integration-loader')",
      errors: [{ messageId: "relativeIntegration" }],
    },
  ],
});

ruleTester.run("integration-import-exception", integrationImportException, {
  valid: [
    // nothing allowed, nothing listed (no-integration-imports reports those as errors)
    {
      filename: app("src/x.ts"),
      code: "import { a } from '@integrations/commerce-acme'",
    },
    // an allowed file's other imports are not exceptions
    {
      filename: app("src/data-source/wiring.ts"),
      code: "import { a } from '@core/contracts/cart/cart'",
      options: [allowWiring],
    },
    // the same path in another package is not listed
    {
      filename: core("src/data-source/wiring.ts"),
      code: "import { a } from '@integrations/commerce-acme'",
      options: [allowWiring],
    },
  ],
  invalid: [
    // every allowed import is listed, one report each
    {
      filename: app("src/data-source/wiring.ts"),
      code: "import { CommerceModule } from '@integrations/commerce-acme'\nimport type { AuthModule } from '@integrations/auth-acme'",
      options: [allowWiring],
      errors: [{ messageId: "exception" }, { messageId: "exception" }],
    },
  ],
});
