import fs from "node:fs";
import path from "node:path";

/**
 * Keeps every integration package self-contained. Applies to files of a package that sits at
 * `integrations/<vendor>/<category>` (or a vendor's shared `integrations/<vendor>/core`); elsewhere it does nothing.
 * Such a file may not import:
 * - another integration package (`@integrations/*` other than its own and its vendor's core),
 * - apps, demo or test code (`@apps/*`, `@demo/*`, `@test/*`),
 * - the kit's framework internals (`@core/integration-kit/core` or any deeper path): only its author API
 *   (`@core/integration-kit`) and its contract suite (`@core/integration-kit/testing`),
 * - a relative path that leaves its own package.
 */

/** The integration kit's entries an integration may import: the author API and the contract suite. */
const KIT = "@core/integration-kit";
const KIT_ENTRIES = new Set([KIT, `${KIT}/testing`]);

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
      kitInternals:
        "'{{source}}' is the integration kit's framework side. An integration imports only the author API (@core/integration-kit) and the contract suite (@core/integration-kit/testing).",
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
      } else if (name === KIT && !KIT_ENTRIES.has(source)) {
        context.report({ node, messageId: "kitInternals", data: { source } });
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
  // a config file is named by its path from the monorepo root, never by a package name: any folder can hold a
  // package.json with any name
  const repoFile = path
    .relative(findRepoRoot(dir), filename)
    .split(path.sep)
    .join("/");
  const config = Object.hasOwn(context.options[0]?.config ?? {}, repoFile)
    ? context.options[0].config[repoFile]
    : undefined;
  return { filename, own, relativeFile, repoFile, allowed, config };
}

/**
 * How a vendor's name is written (`acme`, `Acme`, `ACME`), as a pattern for its own name in any text. Other
 * mixtures of case are other words (a vendor's name inside a longer identifier such as `DialogContentFullscreen` is not a match).
 */
function vendorPattern(vendors) {
  const forms = vendors.flatMap((v) => {
    const lower = v.toLowerCase();
    return [
      lower,
      lower[0].toUpperCase() + lower.slice(1),
      lower.toUpperCase(),
    ];
  });
  const escape = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return forms.length
    ? new RegExp([...new Set(forms)].map(escape).join("|"), "g")
    : null;
}

/** A GraphQL client only a CMS integration uses; it names no vendor, so it is listed here. */
const GENERIC_SDK = /^graphql-request$/;

/**
 * Vendor SDKs: they belong inside an integration package, never in framework code. A package is a vendor SDK when
 * its name holds a vendor's name (the `vendors` option: the folders under integrations/), or it is GENERIC_SDK.
 */
function isVendorSdk(name, vendors) {
  // an integration package is named after its vendor too; the integration checks handle those
  if (name.startsWith("@integrations/")) return false;
  if (GENERIC_SDK.test(name)) return true;
  const pattern = vendorPattern(vendors ?? []);
  return pattern ? new RegExp(pattern.source).test(name) : false;
}

/**
 * The other direction: code outside `integrations/` (apps, core, config, demo, test) imports no integration
 * package, no vendor SDK and no file inside an integration package. The only exceptions are the ones the rule's
 * `allow` option lists: per package name, per file (path relative to that package), the integration packages
 * it may import, e.g. `{ "@apps/bff": { "src/data-source/data-source.module.ts": ["@integrations/mock-commerce"] } }`.
 * The `config` option lists the shop's config files by their path from the monorepo root (the nearest package.json
 * with `workspaces`), each with the integration entries it may import: `{ "config/shop/shopin.config.ts": ["shopin"] }`
 * lets that file import `@integrations/<any>/shopin` and nothing else of an integration (not its root, not a deeper
 * path). These files name the configured integrations by design (`npm run use` and `npm run setup` write them). A
 * vendor SDK is never allowed, not even there. The `vendors` option names the vendors (the folders under
 * integrations/) whose SDKs it recognises by name.
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
          config: {
            type: "object",
            additionalProperties: {
              type: "array",
              items: { type: "string", pattern: "^[a-z][a-z0-9-]*$" },
            },
          },
          vendors: {
            type: "array",
            items: { type: "string", pattern: "^[a-z0-9][a-z0-9-]*$" },
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
      configEntry:
        "'{{source}}' is not an entry {{file}} may import. A config file imports only an integration's {{entries}} entry, never its root, a deeper path or another entry.",
      intoIntegration:
        "'{{source}}' reaches into the integration package {{target}}. Code outside integrations/ does not import integration files.",
      demo: "'{{source}}' is demo code. An app or core package never imports the demo: the demo reaches the storefront only through the slots of config/storefront (npm run use demo), so a shop build and a shop without demo/ carry none of it.",
    },
  },
  create(context) {
    const scope = allowedFor(context);
    if (!scope) return {};
    const { filename, own, relativeFile, repoFile, allowed, config } = scope;

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
      // apps and core never name the demo (config/ may: `npm run use demo` points its files at the demo's)
      if (name.startsWith("@demo/") && /^(apps|core)\//.test(repoFile)) {
        context.report({ node, messageId: "demo", data: { source } });
        return;
      }
      if (isVendorSdk(name, context.options[0]?.vendors)) {
        context.report({
          node,
          messageId: "vendor",
          data: { source, pkg: own.name ?? path.basename(own.dir) },
        });
      } else if (name.startsWith("@integrations/") && config) {
        // a config file: exactly the listed entries (`@integrations/x/shopin`), nothing else of an integration
        if (!config.includes(source.slice(name.length + 1))) {
          context.report({
            node,
            messageId: "configEntry",
            data: {
              source,
              file: repoFile,
              entries: config.map((entry) => `/${entry}`).join(" or "),
            },
          });
        }
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

/**
 * An integration's code reads no environment variable: the BFF reads the variables its descriptor declares (`env`)
 * and hands them to its ports as options, so the options are the only source. Applies to the files under `src/` of
 * a package at `integrations/<vendor>/<category>` (or `<vendor>/core`); elsewhere it does nothing. Reports
 * `process.env` in any form (`process.env.X`, `process['env']`, `globalThis.process.env`, `const { env } = process`)
 * and `import.meta.env`.
 */
export const integrationEnv = {
  meta: {
    type: "problem",
    docs: {
      description:
        "An integration's source reads no environment variable: its options are the only source",
    },
    schema: [],
    messages: {
      env: "'{{what}}' in an integration. Declare the variable in the descriptor's env and read it from the port's options (PortOptions): the BFF reads the environment, integrations never do.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!filename || !path.isAbsolute(filename)) return {};
    const own = findIntegrationPackage(path.dirname(filename));
    if (!own) return {};
    const inPackage = path.relative(own.dir, filename).split(path.sep);
    if (inPackage[0] !== "src") return {};

    const propertyName = (node) =>
      node.computed ? literal(node.property) : node.property.name;
    const isProcess = (node) =>
      (node.type === "Identifier" && node.name === "process") ||
      (node.type === "MemberExpression" &&
        node.object.type === "Identifier" &&
        node.object.name === "globalThis" &&
        propertyName(node) === "process");

    return {
      MemberExpression(node) {
        if (propertyName(node) !== "env") return;
        if (isProcess(node.object)) {
          context.report({
            node,
            messageId: "env",
            data: { what: "process.env" },
          });
        } else if (
          node.object.type === "MetaProperty" &&
          node.object.meta.name === "import" &&
          node.object.property.name === "meta"
        ) {
          context.report({
            node,
            messageId: "env",
            data: { what: "import.meta.env" },
          });
        }
      },
      VariableDeclarator(node) {
        if (
          node.id.type === "ObjectPattern" &&
          node.init &&
          isProcess(node.init) &&
          node.id.properties.some(
            (p) =>
              p.type === "Property" &&
              (p.computed ? literal(p.key) : (p.key.name ?? p.key.value)) ===
                "env",
          )
        ) {
          context.report({
            node,
            messageId: "env",
            data: { what: "process.env" },
          });
        }
      },
    };
  },
};

/**
 * Framework code names no vendor (D-63), comments and strings included: the `vendors` option lists them (the
 * folders under integrations/, without the mock), and every place a file's text writes one, as `acme`, `Acme` or
 * `ACME`, is reported. The configuration that runs it decides which files are framework code.
 */
export const noVendorName = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Framework code (apps, core) names no vendor, not even in a comment or a string",
    },
    schema: [
      {
        type: "object",
        properties: {
          vendors: {
            type: "array",
            items: { type: "string", pattern: "^[a-z0-9][a-z0-9-]*$" },
          },
        },
        required: ["vendors"],
        additionalProperties: false,
      },
    ],
    messages: {
      vendor:
        '\'{{name}}\' is a vendor. Framework code names no vendor, not even in a comment or a string: say what it does ("the commerce platform", "the CMS") or move the code into the integration.',
    },
  },
  create(context) {
    const pattern = vendorPattern(context.options[0]?.vendors ?? []);
    if (!pattern) return {};
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    return {
      Program() {
        const text = sourceCode.text;
        for (const match of text.matchAll(pattern)) {
          context.report({
            loc: {
              start: sourceCode.getLocFromIndex(match.index),
              end: sourceCode.getLocFromIndex(match.index + match[0].length),
            },
            messageId: "vendor",
            data: { name: match[0] },
          });
        }
      },
    };
  },
};

export const shopinPlugin = {
  meta: { name: "shopin" },
  rules: {
    "integration-boundaries": integrationBoundaries,
    "no-integration-imports": noIntegrationImports,
    "integration-import-exception": integrationImportException,
    "no-relative-integration-path": noRelativeIntegrationPath,
    "integration-env": integrationEnv,
    "no-vendor-name": noVendorName,
  },
};
