import fs from "node:fs";
import path from "node:path";

/**
 * Keeps every integration package self-contained. Applies to files of a package that sits at
 * `integrations/<category>/<name>`; elsewhere it does nothing. Such a file may not import:
 * - another integration package (`@integrations/*` other than its own),
 * - apps, demo or test code (`@apps/*`, `@demo/*`, `@test/*`),
 * - a relative path that leaves its own package.
 */

const packageCache = new Map();

/** The nearest directory holding a package.json, with that package's name. */
function findPackage(startDir) {
  const visited = [];
  let dir = startDir;
  for (;;) {
    if (packageCache.has(dir)) {
      const found = packageCache.get(dir);
      for (const d of visited) packageCache.set(d, found);
      return found;
    }
    visited.push(dir);
    const manifest = path.join(dir, "package.json");
    if (fs.existsSync(manifest)) {
      let name;
      try {
        name = JSON.parse(fs.readFileSync(manifest, "utf8")).name;
      } catch {
        name = undefined;
      }
      const found = { dir, name };
      for (const d of visited) packageCache.set(d, found);
      return found;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      for (const d of visited) packageCache.set(d, null);
      return null;
    }
    dir = parent;
  }
}

/** True for a package directory at `.../integrations/<category>/<name>`. */
function isIntegrationPackage(dir) {
  return path.basename(path.dirname(path.dirname(dir))) === "integrations";
}

function packageNameOf(source) {
  const parts = source.split("/");
  return source.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

const literal = (node) =>
  node && node.type === "Literal" && typeof node.value === "string"
    ? node.value
    : undefined;

/** Calls check(node, source) for every way a file can import: import, export from, import(), require(), TS forms. */
function importVisitors(check) {
  return {
    ImportDeclaration: (node) => check(node.source, node.source.value),
    ExportAllDeclaration: (node) => check(node.source, node.source.value),
    ExportNamedDeclaration: (node) => {
      if (node.source) check(node.source, node.source.value);
    },
    ImportExpression: (node) => check(node.source, literal(node.source)),
    CallExpression: (node) => {
      if (
        node.callee.type === "Identifier" &&
        node.callee.name === "require" &&
        node.arguments.length === 1
      ) {
        check(node.arguments[0], literal(node.arguments[0]));
      }
    },
    TSImportEqualsDeclaration: (node) => {
      if (node.moduleReference.type === "TSExternalModuleReference") {
        check(node.moduleReference, literal(node.moduleReference.expression));
      }
    },
    TSImportType: (node) => {
      const argument = node.argument;
      const value =
        argument?.type === "TSLiteralType"
          ? literal(argument.literal)
          : undefined;
      check(node, value);
    },
  };
}

export const integrationBoundaries = {
  meta: {
    type: "problem",
    docs: {
      description:
        "An integration package imports no other integration, no app, demo or test code and nothing outside its own folder",
    },
    schema: [],
    messages: {
      otherIntegration:
        "'{{source}}' is another integration package. An integration imports no other integration; share code through a @core package instead.",
      appCode:
        "'{{source}}' is app, demo or test code. An integration never imports from apps/, demo/ or test/.",
      relativeEscape:
        "'{{source}}' leaves this package ({{pkg}}). Import only files inside the package; use a package import for anything else.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!filename || !path.isAbsolute(filename)) return {};
    const own = findPackage(path.dirname(filename));
    if (!own || !isIntegrationPackage(own.dir)) return {};

    function check(node, source) {
      if (typeof source !== "string") return;
      if (source.startsWith(".")) {
        const target = path.resolve(path.dirname(filename), source);
        if (target !== own.dir && !target.startsWith(own.dir + path.sep)) {
          context.report({
            node,
            messageId: "relativeEscape",
            data: { source, pkg: own.name ?? path.basename(own.dir) },
          });
        }
        return;
      }
      const name = packageNameOf(source);
      if (name.startsWith("@integrations/") && name !== own.name) {
        context.report({
          node,
          messageId: "otherIntegration",
          data: { source },
        });
      } else if (/^@(apps|demo|test)\//.test(name)) {
        context.report({ node, messageId: "appCode", data: { source } });
      }
    }

    return importVisitors(check);
  },
};

/** Vendor SDKs: they belong inside an integration package, never in framework code. */
const VENDOR_SDK =
  /^(@commercetools\/|algoliasearch$|@algolia\/|contentful($|-)|@contentful\/|graphql-request$)/;

/**
 * The other direction: code outside `integrations/` (apps, core, config, demo, test) imports no integration
 * package, no vendor SDK and no file inside an integration package. The only exceptions are the ones the rule's
 * `allow` option lists: per package name, per file (path relative to that package), the integration packages
 * it may import, e.g. `{ "@apps/bff": { "src/data-source/data-source.module.ts": ["@integrations/commerce-mock"] } }`.
 * A vendor SDK is never allowed.
 */
export const noIntegrationImports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Framework code (apps, core, config, demo, test) imports no integration package, no vendor SDK and no file inside an integration, except the files the allow option lists",
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: {
            type: "object",
            additionalProperties: {
              type: "object",
              additionalProperties: {
                type: "array",
                items: { type: "string", pattern: "^@integrations/" },
              },
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      integration:
        "'{{source}}' is an integration package. Code outside integrations/ does not import integrations{{hint}}.",
      vendor:
        "'{{source}}' is a vendor SDK. It belongs inside an integration package under integrations/, never in {{pkg}}.",
      intoIntegration:
        "'{{source}}' reaches into the integration package {{target}}. Code outside integrations/ does not import integration files.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!filename || !path.isAbsolute(filename)) return {};
    const own = findPackage(path.dirname(filename));
    if (!own || isIntegrationPackage(own.dir)) return {};
    const relativeFile = path
      .relative(own.dir, filename)
      .split(path.sep)
      .join("/");
    const allowed = new Set(
      context.options[0]?.allow?.[own.name]?.[relativeFile] ?? [],
    );

    function check(node, source) {
      if (typeof source !== "string") return;
      if (source.startsWith(".")) {
        const target = findPackage(
          path.dirname(path.resolve(path.dirname(filename), source)),
        );
        if (
          target &&
          target.dir !== own.dir &&
          isIntegrationPackage(target.dir)
        ) {
          context.report({
            node,
            messageId: "intoIntegration",
            data: { source, target: target.name ?? path.basename(target.dir) },
          });
        }
        return;
      }
      const name = packageNameOf(source);
      if (VENDOR_SDK.test(name)) {
        context.report({
          node,
          messageId: "vendor",
          data: { source, pkg: own.name ?? path.basename(own.dir) },
        });
      } else if (name.startsWith("@integrations/") && !allowed.has(name)) {
        context.report({
          node,
          messageId: "integration",
          data: {
            source,
            hint: allowed.size
              ? ` (${relativeFile} may import only ${[...allowed].join(", ")})`
              : "; only the files listed in ALLOW (eslint.boundaries.config.mjs) may",
          },
        });
      }
    }

    return importVisitors(check);
  },
};

/**
 * The exceptions `no-integration-imports` lets through, reported as warnings so every run lists them: each is an
 * import outside integrations/ that the `allow` option names. Run it as a warning with --max-warnings set to the
 * current count, so the list can only shrink. Takes the same options as no-integration-imports.
 */
export const integrationImportException = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Lists every allowed integration import outside integrations/ (the allow option of no-integration-imports), so the exceptions stay visible",
    },
    schema: noIntegrationImports.meta.schema,
    messages: {
      exception:
        "'{{source}}' is an allowed exception (ALLOW in eslint.boundaries.config.mjs): {{file}} still imports an integration directly. Remove it when the BFF reaches integrations through ports.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!filename || !path.isAbsolute(filename)) return {};
    const own = findPackage(path.dirname(filename));
    if (!own || isIntegrationPackage(own.dir)) return {};
    const relativeFile = path
      .relative(own.dir, filename)
      .split(path.sep)
      .join("/");
    const allowed = new Set(
      context.options[0]?.allow?.[own.name]?.[relativeFile] ?? [],
    );
    if (!allowed.size) return {};
    return importVisitors((node, source) => {
      if (typeof source === "string" && allowed.has(packageNameOf(source))) {
        context.report({
          node,
          messageId: "exception",
          data: { source, file: `${own.name}/${relativeFile}` },
        });
      }
    });
  },
};

/**
 * No relative import path names an integration: `../../integrations/...` or any relative path containing
 * "integration" is refused everywhere, so code reaches an integration only by its package name (and only where
 * the other two rules allow that). Config files (`*.config.*`) are left out by the configuration that runs it.
 */
export const noRelativeIntegrationPath = {
  meta: {
    type: "problem",
    docs: {
      description:
        'A relative import path never contains "integration"; integrations are reached by package name only',
    },
    schema: [],
    messages: {
      relativeIntegration:
        "'{{source}}' is a relative path that names an integration. Reach an integration only by its package name.",
    },
  },
  create(context) {
    return importVisitors((node, source) => {
      if (
        typeof source === "string" &&
        source.startsWith(".") &&
        /integration/i.test(source)
      ) {
        context.report({
          node,
          messageId: "relativeIntegration",
          data: { source },
        });
      }
    });
  },
};

export const shopinPlugin = {
  meta: { name: "shopin" },
  rules: {
    "integration-boundaries": integrationBoundaries,
    "no-integration-imports": noIntegrationImports,
    "integration-import-exception": integrationImportException,
    "no-relative-integration-path": noRelativeIntegrationPath,
  },
};
