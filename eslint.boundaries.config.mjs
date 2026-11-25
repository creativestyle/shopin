/**
 * Integration boundaries for the whole monorepo, in one run: `npm run lint:boundaries` (also part of `npm run lint`).
 *
 * - shopin/integration-boundaries: a package in integrations/<category>/<name> imports no other integration, no
 *   apps/demo/test code and no relative path outside its folder.
 * - shopin/no-integration-imports: code outside integrations/ imports no integration package and no vendor SDK,
 *   except the files listed in ALLOW below.
 * - shopin/integration-import-exception: lists each ALLOW entry as a warning on every run; `lint:boundaries`
 *   caps the warnings at today's count (--max-warnings in package.json), so the list can only shrink.
 * - shopin/no-relative-integration-path: no relative import path contains "integration" (config files excepted).
 *
 * Inline `eslint-disable` comments have no effect here: the only way to allow an import is an ALLOW entry.
 */
import typescriptEslint from "typescript-eslint";
import { shopinPlugin } from "@core/eslint-config/boundaries";

/** The integration packages the BFF's data-source wiring picks from per request. */
const BFF_WIRING = [
  "@integrations/commerce-commercetools",
  "@integrations/auth-commercetools",
  "@integrations/commerce-mock",
  "@integrations/cms-mock",
  "@integrations/psp-mock",
  "@integrations/cms-contentful",
  "@integrations/search-algolia",
  "@integrations/search-commerce",
];

/**
 * Every place outside integrations/ that may import an integration package: per package, per file, which ones.
 * Moving the BFF onto ports removes the BFF entries; this list may only shrink.
 */
const ALLOW = {
  "@apps/bff": {
    "src/data-source/data-source.module.ts": BFF_WIRING,
    "src/data-source/data-source.factory.ts": BFF_WIRING,
  },
  "@apps/presentation": {
    "app/[variant]/[locale]/demo/mocked-payment-step/[paymentId]/page.tsx": [
      "@integrations/psp-mock-payment-page",
    ],
  },
};

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/storybook-static/**",
      "**/coverage/**",
      "**/test-results/**",
      "**/playwright-report/**",
      ".claude/**",
      "apps/typedoc/docs/**",
      "core/eslint-config/test/fixtures/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}"],
    languageOptions: {
      parser: typescriptEslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    plugins: { shopin: shopinPlugin },
    rules: {
      "shopin/integration-boundaries": "error",
      "shopin/no-integration-imports": ["error", { allow: ALLOW }],
      // lists every ALLOW entry on each run; package.json caps the count (--max-warnings), lower it as entries go
      "shopin/integration-import-exception": ["warn", { allow: ALLOW }],
      "shopin/no-relative-integration-path": "error",
    },
  },
  {
    // config files may point at integration folders by path (tsconfig references, watch lists, …)
    files: ["**/*.config.{ts,mts,cts,js,mjs,cjs}", "**/eslint.config.*"],
    rules: {
      "shopin/no-relative-integration-path": "off",
    },
  },
];
