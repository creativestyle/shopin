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
