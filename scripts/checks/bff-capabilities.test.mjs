/**
 * The deployment's /bff/capabilities check, run as the deployment runs it (the script, its exit code, its output)
 * against a local server answering what a BFF answers.
 */
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
  new URL("./bff-capabilities.mjs", import.meta.url),
);

/** What the local "BFF" answers next: status and body (a string is sent as is). */
let answer = { status: 200, body: {} };
const server = createServer((req, res) => {
  if (req.url !== "/bff/capabilities") {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(answer.status, { "content-type": "application/json" });
  res.end(
    typeof answer.body === "string" ? answer.body : JSON.stringify(answer.body),
  );
});
let base;
before(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const run = (...args) =>
  new Promise((resolve) => {
    execFile(process.execPath, [script, ...args], (error, stdout, stderr) =>
      resolve({ code: error ? error.code : 0, stdout, stderr }),
    );
  });

const served = {
  providers: {
    commerce: "shop-commerce",
    search: "shop-commerce",
    cms: "shop-cms",
    psp: "shop-psp",
  },
  unavailable: { auth: "not configured" },
  services: { wishlist: true },
  unavailableProviders: {},
};

test("every configured category served (a category left out of the config is no failure): exit 0", async () => {
  answer = { status: 200, body: served };
  const { code, stdout } = await run(base);
  assert.equal(code, 0);
  assert.match(
    stdout,
    /ok \(commerce: shop-commerce, search: shop-commerce, cms: shop-cms, psp: shop-psp\)/,
  );
});

test("a category whose credentials check failed: exit 1, the category and its reason named", async () => {
  const { search, ...providers } = served.providers;
  answer = {
    status: 200,
    body: {
      ...served,
      providers,
      unavailable: {
        ...served.unavailable,
        search: "credentials check failed",
      },
    },
  };
  const { code, stderr } = await run(base);
  assert.equal(code, 1);
  assert.match(stderr, /search: unavailable \(credentials check failed\)/);
  assert.doesNotMatch(stderr, /auth/);
});

test("an integration behind another that cannot serve: exit 1, named with its category", async () => {
  answer = {
    status: 200,
    body: {
      ...served,
      unavailableProviders: {
        cms: { "other-cms": "credentials check failed" },
      },
    },
  };
  const { code, stderr } = await run(base);
  assert.equal(code, 1);
  assert.match(
    stderr,
    /cms: "other-cms" cannot serve \(credentials check failed\)/,
  );
});

test("no readable answer (an error status, no JSON, another shape): exit 2, never a pass", async () => {
  for (const [status, body] of [
    [503, served],
    [200, "not json"],
    [200, { status: "ok" }],
    [200, { unavailable: {} }],
  ]) {
    answer = { status, body };
    const { code, stderr } = await run(base);
    assert.equal(code, 2, `${status} ${JSON.stringify(body)}`);
    assert.match(stderr, /cannot check/);
  }
});

test("no BFF listening, or no URL given: exit 2", async () => {
  const closed = createServer();
  await new Promise((resolve) => closed.listen(0, "127.0.0.1", resolve));
  const port = closed.address().port;
  await new Promise((resolve) => closed.close(resolve));
  assert.equal((await run(`http://127.0.0.1:${port}`)).code, 2);
  assert.equal((await run()).code, 2);
});
