/**
 * The build's environment pass-through names no vendor variable (story criterion 8c): no `env`, `passThroughEnv`,
 * `globalEnv` or `globalPassThroughEnv` entry of a turbo.json (the root's or a workspace package's) matches a
 * variable an integration declares. The variables are read from the integrations themselves: every `env: '<NAME>'`
 * in an integration's src/ (its descriptor's env schema, wherever it is spread from) and a tool's
 * `"shopin": { "env": [...] }`. No vendor is listed here.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import typescriptEslint from "typescript-eslint";

const ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const SOURCE = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const SKIP = new Set(["node_modules", "dist", "__tests__", "__fixtures__"]);

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const dirs = (dir) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => path.join(dir, d.name))
    : [];

/** The source files below `dir`, without tests, fixtures and build output. */
function sources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) return SKIP.has(d.name) ? [] : sources(full);
    return SOURCE.test(d.name) && !/\.(test|spec)\./.test(d.name) ? [full] : [];
  });
}

/** Every `env: '<NAME>'` property of a file (an env schema entry), by a walk of its syntax tree. */
function envNames(file) {
  const { ast } = typescriptEslint.parser.parseForESLint(
    fs.readFileSync(file, "utf8"),
    {
      ecmaFeatures: { jsx: /x$/.test(file) },
      sourceType: "module",
    },
  );
  const names = [];
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node.type !== "string") return;
    if (
      node.type === "Property" &&
      !node.computed &&
      (node.key.name ?? node.key.value) === "env"
    ) {
      const v = node.value;
      if (v.type === "Literal" && typeof v.value === "string")
        names.push(v.value);
      if (v.type === "TemplateLiteral" && v.expressions.length === 0)
        names.push(v.quasis[0].value.cooked);
    }
    for (const [key, value] of Object.entries(node)) {
      if (key !== "parent" && value && typeof value === "object") walk(value);
    }
  };
  walk(ast);
  return names;
}

/** Variable → where an integration declares it, for every package at integrations/<vendor>/<part>. */
export function declaredEnv(root) {
  const declared = new Map();
  for (const vendor of dirs(path.join(root, "integrations"))) {
    for (const part of dirs(vendor)) {
      const manifest = path.join(part, "package.json");
      if (!fs.existsSync(manifest)) continue;
      for (const name of readJson(manifest).shopin?.env ?? [])
        declared.set(name, path.relative(root, manifest));
      const src = path.join(part, "src");
      if (!fs.existsSync(src)) continue;
      for (const file of sources(src))
        for (const name of envNames(file))
          declared.set(name, path.relative(root, file));
    }
  }
  return declared;
}

/** The turbo.json files: the root's and each workspace package's (workspace globs with `*` segments). */
function turboFiles(root) {
  const packages = (
    readJson(path.join(root, "package.json")).workspaces ?? []
  ).flatMap((glob) =>
    glob
      .split("/")
      .reduce(
        (found, segment) =>
          found.flatMap((dir) =>
            segment === "*" ? dirs(dir) : [path.join(dir, segment)],
          ),
        [root],
      ),
  );
  return [root, ...packages]
    .map((dir) => path.join(dir, "turbo.json"))
    .filter((file) => fs.existsSync(file));
}

/** Every pass-through entry: `{ file, key, entry }` (negations, `!X`, pass nothing). */
function passThrough(root) {
  return turboFiles(root).flatMap((file) => {
    const turbo = readJson(file);
    const lists = [
      ["globalEnv", turbo.globalEnv],
      ["globalPassThroughEnv", turbo.globalPassThroughEnv],
      ...Object.entries(turbo.tasks ?? {}).flatMap(([task, config]) => [
        [`tasks.${task}.env`, config.env],
        [`tasks.${task}.passThroughEnv`, config.passThroughEnv],
      ]),
    ];
    return lists.flatMap(([key, entries]) =>
      (entries ?? [])
        .filter((entry) => !entry.startsWith("!"))
        .map((entry) => ({ file: path.relative(root, file), key, entry })),
    );
  });
}

/** Each pass-through entry that lets a declared variable through, with the variable and where it is declared. */
export function vendorPassThrough(root) {
  const declared = declaredEnv(root);
  return passThrough(root).flatMap(({ file, key, entry }) => {
    const pattern = new RegExp(
      `^${entry
        .split("*")
        .map((t) => t.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*")}$`,
    );
    return [...declared]
      .filter(([name]) => pattern.test(name))
      .map(
        ([name, where]) =>
          `${file} ${key} "${entry}" passes ${name} (declared in ${where})`,
      );
  });
}

test("the build passes no variable an integration declares", () => {
  const declared = declaredEnv(ROOT);
  // the integrations declare variables, so the check has something to find
  assert.ok(
    declared.size > 0,
    "no integration declares a variable: the scan is broken",
  );
  assert.deepEqual(vendorPassThrough(ROOT), []);
});

/** A throwaway repo: { "<relative path>": file content (an object is written as JSON) }. */
function tempRepo(files) {
  const base = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "turbo-env-")),
  );
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(base, file)), { recursive: true });
    fs.writeFileSync(
      path.join(base, file),
      typeof content === "string" ? content : JSON.stringify(content),
    );
  }
  return base;
}

test("a pass-through entry that names or matches a declared variable fails", (t) => {
  const repo = tempRepo({
    "package.json": { workspaces: ["apps/*", "integrations/*/*"] },
    "turbo.json": {
      globalPassThroughEnv: ["ACME_REGION"],
      tasks: {
        build: { env: ["NEXT_*", "!ACME_TOKEN"] },
        test: { passThroughEnv: ["TMPDIR", "ACME_SYNC_KEY"] },
      },
    },
    "apps/web/package.json": { name: "@apps/web" },
    "apps/web/turbo.json": { tasks: { build: { env: ["ACME_*"] } } },
    // the descriptor spreads its schema from the vendor's core, as real integrations do
    "integrations/acme/core/package.json": { name: "@integrations/acme-core" },
    "integrations/acme/core/src/env.ts":
      "export const acmeEnv = { token: { env: 'ACME_TOKEN' }, region: { env: `ACME_REGION`, optional: true } } as const\n",
    "integrations/acme/commerce/package.json": {
      name: "@integrations/acme-commerce",
    },
    "integrations/acme/commerce/src/shopin.ts":
      "import { acmeEnv } from '@integrations/acme-core'\nexport const acme = () => ({ id: 'acme', env: { commerce: { ...acmeEnv } } })\n",
    // a tool declares its variables in its manifest
    "integrations/acme/sync/package.json": {
      name: "@integrations/acme-sync",
      shopin: {
        toolOf: ["@integrations/acme-commerce"],
        env: ["ACME_SYNC_KEY"],
      },
    },
  });
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));

  assert.deepEqual([...declaredEnv(repo).keys()].sort(), [
    "ACME_REGION",
    "ACME_SYNC_KEY",
    "ACME_TOKEN",
  ]);
  assert.deepEqual(vendorPassThrough(repo).sort(), [
    'apps/web/turbo.json tasks.build.env "ACME_*" passes ACME_REGION (declared in integrations/acme/core/src/env.ts)',
    'apps/web/turbo.json tasks.build.env "ACME_*" passes ACME_SYNC_KEY (declared in integrations/acme/sync/package.json)',
    'apps/web/turbo.json tasks.build.env "ACME_*" passes ACME_TOKEN (declared in integrations/acme/core/src/env.ts)',
    'turbo.json globalPassThroughEnv "ACME_REGION" passes ACME_REGION (declared in integrations/acme/core/src/env.ts)',
    'turbo.json tasks.test.passThroughEnv "ACME_SYNC_KEY" passes ACME_SYNC_KEY (declared in integrations/acme/sync/package.json)',
  ]);
});
