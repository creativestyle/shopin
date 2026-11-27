/**
 * `npm run e2e:demo`: the E2E suite on the demo config, the shop's specs plus the demo's (demo/e2e/specs, the
 * provider switch). Fails with the steps to take unless `npm run use demo` is on; extra arguments go to
 * `playwright test` (e.g. `npm run e2e:demo -- --project=demo`).
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const root = new URL("../../", import.meta.url);
const fail = (message) => {
  console.error(`e2e:demo: ${message}`);
  process.exit(1);
};

if (!existsSync(new URL("demo/e2e/specs", root))) {
  fail(
    "there is no demo/e2e/specs (the demo was removed from this repository): nothing to run.",
  );
}

// what the demo specs select with: the search provider cookie and header of the demo's switch
const data = JSON.parse(
  readFileSync(new URL("config/storefront/storefront-data.json", root), "utf8"),
);
const search = data.variants?.dimensions?.find((d) => d.name === "search");
if (
  search?.cookie !== "shopin-search" ||
  search?.header !== "X-Search-Provider" ||
  !search.values?.includes("commerce") ||
  !search.values?.includes("algolia")
) {
  fail(
    [
      "the demo config is not on (config/storefront/storefront-data.json has no search provider switch).",
      "  1. npm run use demo                 (repository root; points the config at the demo and runs setup)",
      "  2. npm run build:e2e                (apps/presentation; stop a running start:e2e server first, it is reused)",
      "  3. npm run e2e:demo                 (again)",
      "Back to the shop config afterwards: npm run use demo off, then npm run build:e2e.",
    ].join("\n"),
  );
}

const run = spawnSync("npx", ["playwright", "test", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, E2E_DEMO: "1" },
  shell: process.platform === "win32",
});
process.exit(run.status ?? 1);
