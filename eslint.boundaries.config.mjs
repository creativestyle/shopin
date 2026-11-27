/**
 * Integration boundaries for the whole monorepo, in one run: `npm run lint:boundaries` (also part of `npm run lint`).
 *
 * - shopin/integration-boundaries: a package in integrations/<vendor>/<category> imports no other integration
 *   (except its vendor's integrations/<vendor>/core), no apps/demo/test code and no relative path outside its folder.
 * - shopin/no-integration-imports: code outside integrations/ imports no integration package and no vendor SDK,
 *   except the shop's config files (CONFIG, by design: each only the integration entries listed for it) and the
 *   files listed in ALLOW below (exceptions).
 * - shopin/integration-import-exception: lists each allowed import as a warning on every run, so the exceptions
 *   stay visible. The number of ALLOW entries is fixed below (ALLOW_ENTRIES), so the list can only shrink.
 * - shopin/no-relative-integration-path: no relative import path goes through an integrations/ folder (config files
 *   excepted).
 *
 * Inline `eslint-disable` comments have no effect here: the only way to allow an import is an ALLOW entry.
 */
import typescriptEslint from "typescript-eslint";
import { shopinPlugin } from "@core/eslint-config/boundaries";

/**
 * The shop's config files, by their path from the repository root: they name the configured integrations by design
 * (`npm run use` and `npm run setup` write them), so each may import exactly the integration entries listed here
 * (`@integrations/<any>/shopin`, the descriptor; `/page`, a storefront page slot; `/preview`, a CMS's preview request
 * reader), never an integration's root or a deeper
 * path, never a vendor SDK. The hand-written storefront.mts files import no integration. The apps reach integrations
 * only through the ports and these files.
 */
const CONFIG = {
  "config/shop/shopin.config.ts": ["shopin"],
  "config/storefront/wired.mts": ["page", "preview"],
  "demo/shop/config/shopin.config.ts": ["shopin"],
};

/** How many files CONFIG lists. Loading this config fails when the count differs: a new config file is a review. */
const CONFIG_FILES = 3;
if (Object.keys(CONFIG).length !== CONFIG_FILES) {
  throw new Error(
    `eslint.boundaries.config.mjs: CONFIG lists ${Object.keys(CONFIG).length} files, CONFIG_FILES says ${CONFIG_FILES}. ` +
      "A file outside integrations/ reaches an integration through a port, not by joining CONFIG.",
  );
}

/**
 * Every other place outside integrations/ that may import an integration package: per package, per file, which
 * ones. None: the BFF reaches integrations through ports, and the storefront through the wiring setup writes.
 */
const ALLOW = {};

/**
 * How many entries (package, file, integration) ALLOW holds today. Loading this config fails when the count
 * differs: lower it in the same change that removes an entry; never raise it to make room for a new one.
 */
const ALLOW_ENTRIES = 0;
const allowEntries = Object.values(ALLOW)
  .flatMap((files) => Object.values(files))
  .reduce((count, integrations) => count + integrations.length, 0);
if (allowEntries !== ALLOW_ENTRIES) {
  throw new Error(
    `eslint.boundaries.config.mjs: ALLOW holds ${allowEntries} entries, ALLOW_ENTRIES says ${ALLOW_ENTRIES}. ` +
      "Removing an entry: lower ALLOW_ENTRIES with it. Adding one is not allowed: import through a port instead.",
  );
}

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
      "shopin/no-integration-imports": [
        "error",
        { allow: ALLOW, config: CONFIG },
      ],
      // lists every allowed import on each run; ALLOW_ENTRIES above keeps the list from growing
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
