/**
 * S1 CMS swap on a multi-category provider: commerce = `local` (in-memory, also serves cms); cms local →
 * `headless` (a cms-only fixture with its own env). Two boots of the real BFF, each with its own config (the
 * only difference) and exactly its ports' env. Vendor behaviour (the Contentful client) is tested in
 * integrations/cms/contentful-api/test.
 */
import {
  CORE_ENV,
  exactEnv,
  boot,
  loaded,
  request,
  useConfig,
  bff,
  type Jar,
} from "./harness";

const HEADLESS_ENV = {
  HEADLESS_SPACE: "space-1",
  HEADLESS_ACCESS_TOKEN: "fake-token",
};

async function shop(cms: "local" | "headless") {
  let out: Record<string, unknown> = {};
  await jest.isolateModulesAsync(async () => {
    const fx: typeof import("./fixtures") = require("./fixtures");
    const {
      defineConfig,
    }: typeof import("@core/integration-kit") = require("@core/integration-kit");
    const local = fx.inMemoryCommerce({
      id: "local",
      also: ["search", "cms", "psp"],
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
    useConfig(() =>
      defineConfig({
        commerce: local,
        search: local,
        cms: cms === "local" ? local : headless,
        psp: local,
      }),
    );
    const { read } = exactEnv({
      ...CORE_ENV,
      ...(cms === "headless" ? HEADLESS_ENV : {}),
    });
    const app = await boot();
    const { ProductService } = bff("features/product/product.service");
    const { CartService } = bff("features/cart/cart.service");
    const { ContentService } = bff("features/content/content.service");
    const jar: Jar = {};
    const r = await request(app, jar);
    const product = await (await r.get(ProductService)).getProductPage("shoe");
    const cart = await (
      await r.get(CartService)
    ).addToCart({ productId: "p-1", quantity: 2 } as never);
    const r2 = await request(app, jar);
    const page = await (
      await r2.get(ContentService)
    ).getContentPage("about", false);
    out = {
      ports: loaded(),
      envRead: [...read].filter((n) => /^HEADLESS_/.test(n)),
      options: { local: local.state.options, headless: headless.state.options },
      product,
      cart: {
        lineItems: cart.lineItems.map(
          (l: { productId: string; quantity: number }) => [
            l.productId,
            l.quantity,
          ],
        ),
        total: cart.grandTotal,
      },
      pageTitle: (page as { title?: string }).title,
    };
    await app.close();
  });
  return out as {
    ports: string[];
    envRead: string[];
    options: Record<string, Record<string, unknown>>;
    product: unknown;
    cart: { lineItems: unknown[]; total: unknown };
    pageTitle: string;
  };
}

describe("S1: cms local → headless, commerce stays local", () => {
  it("commerce data and cart are unchanged; the old cms port is not loaded; only the new port gets its env", async () => {
    const before = await shop("local");
    const after = await shop("headless");
    expect(before.ports).toContain("cms:local");
    expect(after.ports).not.toContain("cms:local");
    expect(after.ports).toContain("cms:headless");
    expect(before.cart.lineItems).toEqual([["p-1", 2]]);
    expect(after.product).toEqual(before.product);
    expect(after.cart).toEqual(before.cart);
    // the page comes from the new cms port, built with the space option it was handed
    expect(before.pageTitle).toBe("local:about");
    expect(after.pageTitle).toBe("headless/space-1:about");
    // the new port gets exactly its declared variables as options; the local ports get none
    expect(after.options.headless).toEqual({
      cms: { space: "space-1", accessToken: "fake-token" },
    });
    expect(after.options.local).toEqual({ commerce: {}, search: {}, psp: {} });
    // neither boot read a cms variable from process.env (the BFF hands them over; they are not globals)
    expect(before.envRead).toEqual([]);
    expect(after.envRead).toEqual([]);
  });
});
