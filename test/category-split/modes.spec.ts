/**
 * Resolution modes. No switch (a real shop): one provider per category resolved at start-up, singleton
 * providers only, no provider header read. (Per-request choice is the demo switch's, tested in its package.)
 * Two fixture commerce platforms: `remote` (commerce + search) and `local` (commerce + search + cms).
 */
import { inspect } from "./harness";

type Fixtures = typeof import("./fixtures");
type Kit = typeof import("@core/integration-kit");

describe("resolution modes", () => {
  it("switcher off: start-up resolution, singletons only, the provider header is not read", async () => {
    const o = await inspect((fx, kit) => {
      const remote = fx.inMemoryCommerce({
        id: "remote",
        also: ["search"],
        guestSession: true,
      });
      const local = fx.inMemoryCommerce({
        id: "local",
        also: ["search", "cms"],
      });
      return kit.defineConfig({ commerce: remote, search: remote, cms: local });
    });
    expect(o.ports).toEqual(["commerce:remote", "search:remote", "cms:local"]);
    // every port module was inspected, each with at least its options, vault, customer context and port
    expect(o.portModulesFound).toEqual(o.portModulesExpected);
    expect(o.checked).toBeGreaterThanOrEqual(3 * 4);
    expect(o.requestScoped).toEqual([]);
    expect(o.factoryStatic).toBe(true);
    expect(o.commerceWithLocalHeader).toBe("remote");
    expect(o.storefrontHeaders).toEqual([]);
  });
});

describe("config/shop (all mock): resolved once, mock end to end", () => {
  it("capabilities, a sign-in and a cart call all reach the mock's ports; nothing else is loaded", async () => {
    await jest.isolateModulesAsync(async () => {
      // the shop's real config (the test above mocked @shopin/config for its own boot)
      jest.dontMock("@shopin/config");
      const { CORE_ENV, exactEnv, boot, http, bff, loaded } =
        require("./harness") as typeof import("./harness");
      exactEnv({ ...CORE_ENV });
      const app = await boot();
      // every category the shop configures, sign-in included, by the mock; no other port, no delegate
      expect(loaded()).toEqual([
        "commerce:mock",
        "cms:mock",
        "psp:mock",
        "auth:mock-identity",
      ]);
      const { Ports } = bff("data-source/ports.module");
      const ports = app.get(Ports);
      // records the calls that reach a port member, then runs it (the BFF serves the port through its own wrapper)
      const record = (
        member: Record<string, (...a: never[]) => unknown>,
        name: string,
      ) => {
        const calls = jest.fn(member[name]);
        member[name] = calls;
        return calls;
      };
      const signIn = record(ports.auth, "signIn");
      const link = record(ports.commerce.customers, "findByExternalId");
      const addToCart = record(ports.commerce.cartService, "addToCart");
      const server = await http(app);
      try {
        const capabilities = await server.fetch("/bff/capabilities");
        expect(capabilities.body.providers).toEqual({
          commerce: "mock",
          search: "mock",
          cms: "mock",
          psp: "mock",
          auth: "mock-identity",
        });
        const jar = new Map<string, string>();
        let csrf = "";
        const send = async (method: string, path: string, body?: unknown) => {
          const res = await server.fetch(path, {
            method,
            headers: {
              "content-type": "application/json",
              "accept-language": "en-US",
              cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
              ...(csrf ? { "x-csrf-token": csrf } : {}),
            },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          });
          for (const cookie of res.cookies) {
            if (!cookie) continue;
            const at = cookie.indexOf("=");
            if (cookie.slice(at + 1))
              jar.set(cookie.slice(0, at), cookie.slice(at + 1));
            else jar.delete(cookie.slice(0, at));
          }
          return res;
        };
        csrf = (await send("GET", "/bff/csrf/token")).body.token;
        // the mock identity's fixture user (integrations/mock/auth/src/fixtures.ts)
        const login = await send("POST", "/bff/auth/login", {
          email: "alice@example.com",
          password: "mock-password",
        });
        expect(login.status).toBe(200);
        expect(signIn).toHaveBeenCalledTimes(1);
        // not the mock's own sign-in (another provider id): linked through the mock commerce's customers
        expect(link).toHaveBeenCalledWith("mock-identity:mock-idp|alice");
        // a new CSRF token for the signed-in session, as the storefront fetches it
        csrf = (await send("GET", "/bff/csrf/token")).body.token;
        const search = await send(
          "GET",
          "/bff/productSearch?query=shirt&limit=1",
        );
        const added = await send("POST", "/bff/cart/items", {
          productId: search.body.products[0].id,
          quantity: 1,
        });
        expect(added.status).toBe(201);
        expect(addToCart).toHaveBeenCalledTimes(1);
        expect(loaded()).toEqual([
          "commerce:mock",
          "cms:mock",
          "psp:mock",
          "auth:mock-identity",
        ]);
      } finally {
        await server.close();
      }
    });
  });
});
