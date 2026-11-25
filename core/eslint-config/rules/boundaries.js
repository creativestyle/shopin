import fs from "node:fs";
import path from "node:path";

/**
 * Keeps every integration package self-contained. Applies to files of a package that sits at
 * `integrations/<vendor>/<category>` (or a vendor's shared `integrations/<vendor>/core`); elsewhere it does nothing.
 * Such a file may not import:
 * - another integration package (`@integrations/*` other than its own and its vendor's core),
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

const rootCache = new Map();

/**
 * The monorepo root above a path: the nearest directory whose package.json declares `workspaces` (the filesystem
 * root when there is none). Folders above it never count, so a checkout under `.../integrations/x/` stays checked.
 */
function findRepoRoot(start) {
  for (let dir = start; ; ) {
    if (rootCache.has(dir)) return rootCache.get(dir);
    const manifest = path.join(dir, "package.json");
    let root;
    if (fs.existsSync(manifest)) {
      try {
        if (JSON.parse(fs.readFileSync(manifest, "utf8")).workspaces)
          root = dir;
      } catch {
        // an unreadable manifest is not a root
      }
    }
    const parent = path.dirname(dir);
    if (root || parent === dir) {
      root ??= dir;
      rootCache.set(start, root);
      return root;
    }
    dir = parent;
  }
}

/** True for a package directory at `<repo>/integrations/<vendor>/<category>` (including `<vendor>/core`). */
function isIntegrationPackage(dir) {
  const parts = path.relative(findRepoRoot(dir), dir).split(path.sep);
  return parts.length === 3 && parts[0] === "integrations";
}

/** A path with its symlinks resolved, as far as it exists (`node_modules/@integrations/x` → `integrations/v/c`). */
function realPath(target) {
  let existing = target;
  while (!fs.existsSync(existing)) {
    const parent = path.dirname(existing);
    if (parent === existing) return target;
    existing = parent;
  }
  try {
    return path.join(
      fs.realpathSync(existing),
      path.relative(existing, target),
    );
  } catch {
    return target;
  }
}

/**
 * The integration package a path lies in (`.../integrations/<vendor>/<category>` with a package.json), or null. A
 * nested package.json below it does not end the package: its files still belong to the integration.
 */
function findIntegrationPackage(start) {
  const root = findRepoRoot(start);
  for (let dir = start; ; ) {
    if (
      isIntegrationPackage(dir) &&
      fs.existsSync(path.join(dir, "package.json"))
    )
      return findPackage(dir);
    const parent = path.dirname(dir);
    if (dir === root || parent === dir) return null;
    dir = parent;
  }
}

/** The name of the vendor's shared core (`integrations/<vendor>/core`) a part may import, or undefined. */
function vendorCoreOf(pkg) {
  const coreDir = path.join(path.dirname(pkg.dir), "core");
  if (coreDir === pkg.dir || !fs.existsSync(path.join(coreDir, "package.json")))
    return undefined;
  return findPackage(coreDir)?.name;
}

function packageNameOf(source) {
  const parts = source.split("/");
  return source.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/**
 * The module path of an import argument: a string literal, or a template literal's text. A template with
 * expressions gives its static start (`@integrations/${name}` → `@integrations/`), which is enough to see where it
 * points.
 */
const literal = (node) => {
  if (node?.type === "Literal" && typeof node.value === "string")
    return node.value;
  if (node?.type === "TemplateLiteral") return node.quasis[0]?.value.cooked;
  return undefined;
};

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
        "An integration package imports no other integration (except its vendor's core), no app, demo or test code and nothing outside its own folder",
    },
    schema: [],
    messages: {
      otherIntegration:
        "'{{source}}' is another integration package. An integration imports no other integration: code one vendor's parts share goes into integrations/<vendor>/core, code two vendors need into a @core package.",
      appCode:
        "'{{source}}' is app, demo or test code. An integration never imports from apps/, demo/ or test/.",
      relativeEscape:
        "'{{source}}' leaves this package ({{pkg}}). Import only files inside the package; use a package import for anything else.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!filename || !path.isAbsolute(filename)) return {};
    const own = findIntegrationPackage(path.dirname(filename));
    if (!own) return {};
    const vendorCore = vendorCoreOf(own);

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
      if (
        name.startsWith("@integrations/") &&
        name !== own.name &&
        name !== vendorCore
      ) {
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

/**
 * For a file outside integrations/: its package, its path inside that package, and the integration packages the
 * `allow` option lets it import. Null for a file inside an integration package (or outside any package).
 */
function allowedFor(context) {
  const filename = context.filename ?? context.getFilename();
  if (!filename || !path.isAbsolute(filename)) return null;
  const dir = path.dirname(filename);
  const own = findPackage(dir);
  if (!own || findIntegrationPackage(dir)) return null;
  const relativeFile = path
    .relative(own.dir, filename)
    .split(path.sep)
    .join("/");
  const allowed = new Set(
    context.options[0]?.allow?.[own.name]?.[relativeFile] ?? [],
  );
  return { filename, own, relativeFile, allowed };
}

/** Vendor SDKs: they belong inside an integration package, never in framework code. */
const VENDOR_SDK =
  /^(@commercetools\/|algoliasearch$|@algolia\/|contentful($|-)|@contentful\/|graphql-request$)/;

/**
 * The other direction: code outside `integrations/` (apps, core, config, demo, test) imports no integration
 * package, no vendor SDK and no file inside an integration package. The only exceptions are the ones the rule's
 * `allow` option lists: per package name, per file (path relative to that package), the integration packages
 * it may import, e.g. `{ "@apps/bff": { "src/data-source/data-source.module.ts": ["@integrations/mock-commerce"] } }`.
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
    const scope = allowedFor(context);
    if (!scope) return {};
    const { filename, own, relativeFile, allowed } = scope;

    function check(node, source) {
      if (typeof source !== "string") return;
      if (source.startsWith(".")) {
        // the resolved path itself first: an import of a package's root folder is that package
        const target = findIntegrationPackage(
          realPath(path.resolve(path.dirname(filename), source)),
        );
        if (target) {
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
 * import outside integrations/ that the `allow` option names. The configuration that runs it keeps the number of
 * `allow` entries fixed, so the list can only shrink. Takes the same options as no-integration-imports.
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
        "'{{source}}' is an allowed exception (ALLOW in eslint.boundaries.config.mjs): {{file}} still imports an integration directly. Remove the entry once this file no longer needs the direct import.",
    },
  },
  create(context) {
    const scope = allowedFor(context);
    if (!scope?.allowed.size) return {};
    const { own, relativeFile, allowed } = scope;
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
 * No relative import path goes through an `integrations` folder (`../../integrations/...`, or the workspace links in
 * `node_modules/@integrations/...`), so code reaches an
 * integration only by its package name (and only where the other two rules allow that). A file merely named after
 * its job (`./define-integration`) is fine. Config files (`*.config.*`) are left out by the configuration that runs it.
 */
const INTEGRATIONS_SEGMENT = /(^|\/)@?integrations(\/|$)/i;

export const noRelativeIntegrationPath = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A relative import path never goes through an integrations/ folder; integrations are reached by package name only",
    },
    schema: [],
    messages: {
      relativeIntegration:
        "'{{source}}' is a relative path into integrations/. Reach an integration only by its package name.",
    },
  },
  create(context) {
    return importVisitors((node, source) => {
      if (
        typeof source === "string" &&
        source.startsWith(".") &&
        INTEGRATIONS_SEGMENT.test(source)
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
