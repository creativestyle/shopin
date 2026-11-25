import { after, describe, it } from "node:test";
import fs from "node:fs";
import os from "node:os";
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
const commerce = (file) => path.join(repo, "integrations/acme/commerce", file);
const acmeCore = (file) => path.join(repo, "integrations/acme/core", file);
const app = (file) => path.join(repo, "apps/web", file);
const core = (file) => path.join(repo, "core/thing", file);

/** Writes a small throwaway repo under the system temp folder: { "<relative path>": package name | null (symlink) }. */
function tempRepo(prefix, packages, links = {}) {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  for (const [dir, content] of Object.entries(packages)) {
    fs.mkdirSync(path.join(base, dir), { recursive: true });
    fs.writeFileSync(
      path.join(base, dir, "package.json"),
      JSON.stringify(content),
    );
  }
  for (const [link, target] of Object.entries(links)) {
    fs.mkdirSync(path.dirname(path.join(base, link)), { recursive: true });
    fs.symlinkSync(path.join(base, target), path.join(base, link), "dir");
  }
  return base;
}

// a repo whose node_modules links the workspace packages, as npm does
const linked = tempRepo(
  "boundaries-linked-",
  {
    ".": { name: "shop", workspaces: ["apps/*", "integrations/*/*"] },
    "apps/web": { name: "@apps/web" },
    "integrations/acme/commerce": { name: "@integrations/acme-commerce" },
  },
  { "node_modules/@integrations/acme-commerce": "integrations/acme/commerce" },
);
// a repo checked out below a folder that happens to look like integrations/<vendor>/<category>
const nested = tempRepo("boundaries-nested-", {
  "integrations/x/shop": {
    name: "shop",
    workspaces: ["apps/*", "integrations/*/*"],
  },
  "integrations/x/shop/apps/web": { name: "@apps/web" },
});

after(() => {
  for (const dir of [linked, nested])
    fs.rmSync(dir, { recursive: true, force: true });
});

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
      code: "import { a } from '@integrations/acme-commerce'",
    },
    // its vendor's core
    {
      filename: commerce("src/x.ts"),
      code: "import { ServerClientService } from '@integrations/acme-core'",
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
    // a dynamic import inside the package
    {
      filename: commerce("src/x.ts"),
      code: "const m = await import(`./locales/${locale}.json`)",
    },
    // outside integration packages the rule does nothing
    {
      filename: app("src/x.ts"),
      code: "import { CartService } from '@integrations/acme-commerce'",
    },
    {
      filename: app("src/x.ts"),
      code: "import { a } from '../../../core/thing/src/a'",
    },
    {
      filename: core("src/x.ts"),
      code: "import { CartService } from '@integrations/acme-commerce'",
    },
  ],
  invalid: [
    // another integration, in every import form
    {
      filename: commerce("src/x.ts"),
      code: "import { LoginService } from '@integrations/acme-auth'",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "import type { LoginService } from '@integrations/acme-auth/dist/login'",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "export * from '@integrations/acme-auth'",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "export { LoginService } from '@integrations/acme-auth'",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "const auth = await import('@integrations/acme-auth')",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "const auth = require('@integrations/acme-auth')",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "import auth = require('@integrations/acme-auth')",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "type Login = import('@integrations/acme-auth').LoginService",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "const auth = await import(`@integrations/acme-auth`)",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "const auth = await import(`@integrations/${name}`)",
      errors: [{ messageId: "otherIntegration" }],
    },
    // a nested package.json inside the integration does not exempt the files below it
    {
      filename: commerce("src/nested/x.ts"),
      code: "import { LoginService } from '@integrations/acme-auth'",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: commerce("src/nested/x.ts"),
      code: "import { LoginService } from '../../../auth/src/login'",
      errors: [{ messageId: "relativeEscape" }],
    },
    // a part reaches its vendor's core by package name only, never by a relative path
    {
      filename: commerce("src/x.ts"),
      code: "import { client } from '../../core/src/client'",
      errors: [{ messageId: "relativeEscape" }],
    },
    // another vendor's core
    {
      filename: commerce("src/x.ts"),
      code: "import { client } from '@integrations/other-core'",
      errors: [{ messageId: "otherIntegration" }],
    },
    // a core never imports a part of its vendor
    {
      filename: acmeCore("src/x.ts"),
      code: "import { CartService } from '@integrations/acme-commerce'",
      errors: [{ messageId: "otherIntegration" }],
    },
    {
      filename: acmeCore("src/x.ts"),
      code: "import { CartService } from '../../commerce/src/cart'",
      errors: [{ messageId: "relativeEscape" }],
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
      code: "import { LoginService } from '../../auth/src/login'",
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
        "import { LoginService } from '@integrations/acme-auth'",
        "import type { LanguageProvider } from '@apps/bff/src/language'",
        "import { other } from '../../auth/src/other'",
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
        "@integrations/acme-commerce",
        "@integrations/acme-auth",
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
      code: "import { CommerceModule } from '@integrations/acme-commerce'\nimport { AuthModule } from '@integrations/acme-auth'",
      options: [allowWiring],
    },
    // the rule leaves integration packages to integration-boundaries
    {
      filename: commerce("src/x.ts"),
      code: "import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk'",
    },
    // also below a nested package.json inside the integration
    {
      filename: commerce("src/nested/x.ts"),
      code: "import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk'",
    },
  ],
  invalid: [
    // an integration package, in every import form
    {
      filename: app("src/x.ts"),
      code: "import { CartService } from '@integrations/acme-commerce'",
      errors: [{ messageId: "integration" }],
    },
    {
      filename: app("src/x.ts"),
      code: "import type { CartService } from '@integrations/acme-commerce'",
      errors: [{ messageId: "integration" }],
    },
    {
      filename: app("src/x.ts"),
      code: "export * from '@integrations/acme-commerce'",
      errors: [{ messageId: "integration" }],
    },
    {
      filename: app("src/x.ts"),
      code: "const m = await import('@integrations/acme-commerce')",
      errors: [{ messageId: "integration" }],
    },
    {
      filename: app("src/x.ts"),
      code: "const m = require('@integrations/acme-commerce')",
      errors: [{ messageId: "integration" }],
    },
    {
      filename: app("src/x.ts"),
      code: "type C = import('@integrations/acme-commerce').CartService",
      errors: [{ messageId: "integration" }],
    },
    {
      filename: core("src/x.ts"),
      code: "import { CartService } from '@integrations/acme-commerce'",
      errors: [{ messageId: "integration" }],
    },
    // the allow list is per file: another file gets nothing
    {
      filename: app("src/features/cart.ts"),
      code: "import { CommerceModule } from '@integrations/acme-commerce'",
      options: [allowWiring],
      errors: [{ messageId: "integration" }],
    },
    // and per package: the listed file gets only the packages listed for it
    {
      filename: app("src/data-source/wiring.ts"),
      code: "import { SearchModule } from '@integrations/acme-search'",
      options: [allowWiring],
      errors: [{ messageId: "integration" }],
    },
    // and per package: the same file path in another package gets nothing
    {
      filename: core("src/data-source/wiring.ts"),
      code: "import { CommerceModule } from '@integrations/acme-commerce'",
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
      code: "import { CartService } from '../../../integrations/acme/commerce/src/cart'",
      errors: [{ messageId: "intoIntegration" }],
    },
    // or through the workspace link in node_modules
    {
      filename: path.join(linked, "apps/web/src/x.ts"),
      code: "import { CartService } from '../../../node_modules/@integrations/acme-commerce'",
      errors: [{ messageId: "intoIntegration" }],
    },
    // a checkout below a folder named like integrations/<vendor>/<category> is still checked
    {
      filename: path.join(nested, "integrations/x/shop/apps/web/src/x.ts"),
      code: "import { CartService } from '@integrations/acme-commerce'",
      errors: [{ messageId: "integration" }],
    },
    // or to the package's root folder
    {
      filename: app("src/x.ts"),
      code: "import { CartService } from '../../../integrations/acme/commerce'",
      errors: [{ messageId: "intoIntegration" }],
    },
    // a template literal, with or without expressions
    {
      filename: app("src/x.ts"),
      code: "const m = await import(`@integrations/acme-commerce`)",
      errors: [{ messageId: "integration" }],
    },
    {
      filename: app("src/x.ts"),
      code: "const m = await import(`@integrations/${name}`)",
      errors: [{ messageId: "integration" }],
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
      code: "import { a } from '@integrations/acme-commerce'",
    },
    {
      filename: commerce("src/x.ts"),
      code: "import { client } from './client/client.module'",
    },
    // a file named after its job is not an integrations/ folder
    {
      filename: app("src/x.ts"),
      code: "const a = await import('./integration-loader')",
    },
    {
      filename: core("src/x.ts"),
      code: "import { defineIntegration } from './define-integration'",
    },
    // (a relative escape between integration packages is integration-boundaries' job)
    {
      filename: commerce("src/x.ts"),
      code: "import { a } from '../../auth/src/integration'",
    },
  ],
  invalid: [
    {
      filename: app("src/x.ts"),
      code: "import { a } from '../../../integrations/acme/commerce/src/cart'",
      errors: [{ messageId: "relativeIntegration" }],
    },
    {
      filename: core("src/x.ts"),
      code: "export * from '../../integrations/other/search'",
      errors: [{ messageId: "relativeIntegration" }],
    },
    {
      filename: commerce("src/x.ts"),
      code: "const a = require('../../Integrations/x')",
      errors: [{ messageId: "relativeIntegration" }],
    },
    {
      filename: app("src/x.ts"),
      code: "import { a } from '../../../integrations'",
      errors: [{ messageId: "relativeIntegration" }],
    },
    {
      filename: app("src/x.ts"),
      code: "import { a } from '../../../node_modules/@integrations/acme-commerce'",
      errors: [{ messageId: "relativeIntegration" }],
    },
  ],
});

ruleTester.run("integration-import-exception", integrationImportException, {
  valid: [
    // nothing allowed, nothing listed (no-integration-imports reports those as errors)
    {
      filename: app("src/x.ts"),
      code: "import { a } from '@integrations/acme-commerce'",
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
      code: "import { a } from '@integrations/acme-commerce'",
      options: [allowWiring],
    },
  ],
  invalid: [
    // every allowed import is listed, one report each
    {
      filename: app("src/data-source/wiring.ts"),
      code: "import { CommerceModule } from '@integrations/acme-commerce'\nimport type { AuthModule } from '@integrations/acme-auth'",
      options: [allowWiring],
      errors: [{ messageId: "exception" }, { messageId: "exception" }],
    },
  ],
});
