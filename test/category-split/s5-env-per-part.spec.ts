/**
 * S5 env per port: each integration declares its variables per category; the BFF reads only the serving
 * ports' variables and hands them over as PortOptions; a missing one fails boot naming integration,
 * category and variable; no port variable stays a global.
 */
import { CORE_ENV, exactEnv, boot, bff, loaded, useConfig } from "./harness";

type Fixtures = typeof import("./fixtures");
type Kit = typeof import("@core/integration-kit");

const REMOTE_ENV = {
  REMOTE_PROJECT_KEY: "p",
  REMOTE_CLIENT_SECRET: "secret",
  REMOTE_API_URL: "https://api.invalid",
};
const REMOTE_SEARCH_ENV = { REMOTE_SEARCH_KEY: "k" };

/** The fixtures of one boot, in the current module registry. */
function fixtures(fx: Fixtures) {
  const remote = fx.inMemoryCommerce({
    id: "remote",
    also: ["search"],
    guestSession: true,
    env: {
      commerce: {
        projectKey: { env: "REMOTE_PROJECT_KEY" },
        clientSecret: { env: "REMOTE_CLIENT_SECRET" },
        apiUrl: { env: "REMOTE_API_URL" },
        storeKeys: { env: "REMOTE_STORE_KEYS", optional: true },
      },
      search: { searchKey: { env: "REMOTE_SEARCH_KEY" } },
    },
    // a port (or its SDK) reading a variable from process.env itself finds nothing
    snoop: ["REMOTE_CLIENT_SECRET", "FINDER_API_KEY", "JWT_SIGNING_KEY"],
    requires: {
      search: {
        needs: { commerce: "remote" },
        reason: "remote search reads the remote catalog",
      },
    },
  });
  const local = fx.inMemoryCommerce({ id: "local", also: ["search", "cms"] });
  const finder = fx.contentOnly({
    id: "finder",
    serves: ["search"],
    env: {
      search: {
        appId: { env: "FINDER_APP_ID" },
        apiKey: { env: "FINDER_API_KEY" },
        index: { env: "FINDER_INDEX" },
      },
    },
  });
  const headless = fx.contentOnly({
    id: "headless",
    serves: ["cms"],
    env: {
      cms: {
        space: { env: "HEADLESS_SPACE" },
        accessToken: { env: "HEADLESS_ACCESS_TOKEN" },
      },
    },
  });
  return { remote, local, finder, headless };
}

describe("S5: env per port", () => {
  it("a missing variable of a chosen port fails boot, naming the integration and the variable", async () => {
    await jest.isolateModulesAsync(async () => {
      const fx: Fixtures = require("./fixtures");
      const kit: Kit = require("@core/integration-kit");
      const { local, headless } = fixtures(fx);
      useConfig(() => kit.defineConfig({ commerce: local, cms: headless }));
      exactEnv({ ...CORE_ENV, HEADLESS_ACCESS_TOKEN: "t" });
      const err = (await boot().catch((e: Error) => e)) as Error;
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain(
        "BFF: cannot start:\n  - missing env for the chosen providers:\n    - headless: HEADLESS_SPACE\n",
      );
      // nothing was loaded: the check runs before any port
      expect(headless.state.options).toEqual({});
      expect(local.state.options).toEqual({});
    });
  });

  it("production: every problem of the core's and the ports' variables is listed in one plain message", async () => {
    await jest.isolateModulesAsync(async () => {
      const fx: Fixtures = require("./fixtures");
      const kit: Kit = require("@core/integration-kit");
      const { local, headless } = fixtures(fx);
      useConfig(() => kit.defineConfig({ commerce: local, cms: headless }));
      const { FRONTEND_URL, JWT_SIGNING_KEY, ...rest } = CORE_ENV;
      void FRONTEND_URL;
      void JWT_SIGNING_KEY;
      exactEnv({ ...rest, NODE_ENV: "production", HEADLESS_SPACE: "s" });
      const err = (await boot().catch((e: Error) => e)) as Error;
      expect(err.message.split("\n").slice(0, 6)).toEqual([
        "BFF: cannot start:",
        expect.stringMatching(/^  - missing core secrets: JWT_SIGNING_KEY \(/),
        expect.stringMatching(/^  - FRONTEND_URL is not set: /),
        expect.stringMatching(/^  - BFF_SESSION_REVOCATIONS_FILE is not set: /),
        "  - missing env for the chosen providers:",
        "    - headless: HEADLESS_ACCESS_TOKEN",
      ]);
      expect(err.message).toMatch(/\.env\.example/);
      // printed as it is: main.ts shows this message without a stack
      const { plainBootError } = require("@apps/bff/src/common/env/env-file");
      expect(plainBootError(err)).toBe(err.message);
      expect(plainBootError(new TypeError("x is undefined"))).toBeUndefined();
    });
  });

  it("start-up mode: a port the config does not choose is neither loaded nor checked", async () => {
    await jest.isolateModulesAsync(async () => {
      const fx: Fixtures = require("./fixtures");
      const kit: Kit = require("@core/integration-kit");
      const { remote, local } = fixtures(fx);
      // remote also provides search (with a variable of its own, unset here), but local serves search
      useConfig(() => kit.defineConfig({ commerce: remote, search: local }));
      exactEnv({ ...CORE_ENV, ...REMOTE_ENV });
      const app = await boot();
      expect(loaded()).toEqual(["commerce:remote", "search:local"]);
      expect(Object.keys(remote.state.options)).toEqual(["commerce"]);
      await app.close();
    });
  });

  it("a variable of an unchosen port is never handed over; the chosen port gets its options through PortOptions", async () => {
    await jest.isolateModulesAsync(async () => {
      const fx: Fixtures = require("./fixtures");
      const kit: Kit = require("@core/integration-kit");
      const { remote, local, finder, headless } = fixtures(fx);
      useConfig(() =>
        kit.defineConfig({ commerce: remote, search: remote, cms: local }),
      );
      // unchosen ports' variables are present (as on a shared server) and must reach no port
      exactEnv({
        ...CORE_ENV,
        ...REMOTE_ENV,
        ...REMOTE_SEARCH_ENV,
        HEADLESS_SPACE: "x",
        HEADLESS_ACCESS_TOKEN: "x",
        FINDER_APP_ID: "x",
        FINDER_API_KEY: "x",
        FINDER_INDEX: "x",
      });
      const app = await boot();
      const { loadedPorts } = require("@apps/bff/src/data-source/ports.module");
      expect(loaded()).toEqual([
        "commerce:remote",
        "search:remote",
        "cms:local",
      ]);
      // each port gets exactly its own declared variables (an optional one unset stays undefined)
      expect(remote.state.options).toEqual({
        commerce: {
          projectKey: "p",
          clientSecret: "secret",
          apiUrl: "https://api.invalid",
          storeKeys: undefined,
        },
        search: { searchKey: "k" },
      });
      expect(local.state.options).toEqual({ cms: {} });
      expect(finder.state.options).toEqual({});
      expect(headless.state.options).toEqual({});
      const handed = JSON.stringify(
        loadedPorts().map((p: { options: unknown }) => p.options),
      );
      expect(handed).not.toMatch(/"x"/);
      // a port reading process.env itself finds neither its own, another port's, nor a core secret
      expect(remote.state.snooped).toEqual({
        REMOTE_CLIENT_SECRET: undefined,
        FINDER_API_KEY: undefined,
        JWT_SIGNING_KEY: undefined,
      });
      // after boot no port variable is a global any more, chosen or not; core secrets are gone too
      // (frozen core config); the core's non-secret variables stay
      const left = Object.keys({ ...process.env });
      expect(left.filter((n) => /^(REMOTE|HEADLESS|FINDER)_/.test(n))).toEqual(
        [],
      );
      expect(left.filter((n) => /^(JWT|CSRF|SESSION)_/.test(n))).toEqual([]);
      expect(left).toEqual(expect.arrayContaining(["FRONTEND_URL"]));
      await app.close();
    });
  });

  it("a config that names a core or another integration’s variable, or lists two providers for a category, is refused", () => {
    const fx: Fixtures = jest.requireActual("./fixtures");
    const kit: Kit = jest.requireActual("@core/integration-kit");
    const { remote, local, finder } = fixtures(fx);
    expect(() =>
      kit.defineConfig({ commerce: [remote, local] as never }),
    ).toThrow("commerce lists several integrations: one serves a category");
    const sneaky = fx.contentOnly({
      id: "sneaky",
      serves: ["cms"],
      env: {
        cms: {
          secret: { env: "JWT_SIGNING_KEY" },
          key: { env: "FINDER_API_KEY" },
        },
      },
    });
    const err = (() => {
      try {
        kit.defineConfig({ commerce: local, search: finder, cms: sneaky });
      } catch (e) {
        return (e as Error).message;
      }
      return "no error";
    })();
    expect(err).toContain(
      '"sneaky" declares the core variable JWT_SIGNING_KEY',
    );
    expect(err).toContain(
      'FINDER_API_KEY is declared by both "finder" and "sneaky"',
    );
  });
});
