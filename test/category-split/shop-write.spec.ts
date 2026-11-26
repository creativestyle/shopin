/**
 * A shopper sets a shop field without a framework change (docs/extending.md, "A field the shopper sets"): the shop
 * declares the field on its cart contract (`contracts.cart`); SHOPin's `PUT /bff/cart/fields` takes exactly the
 * fields that contract adds, checked by it, and writes them to the shopper's cart (from the sealed cookie, never
 * from the request) through the commerce port's `setCartFields`.
 *
 * And the CSRF guard and the `@Reads` check reach every shop route, also in a module a listed feature imports.
 */
import { z } from "zod";
import { CartResponseSchema } from "@core/contracts/cart/cart";
import { defineConfig } from "@core/integration-kit";
import {
  CORE_ENV,
  exactEnv,
  boot,
  request,
  useConfig,
  bff,
  type Jar,
} from "./harness";
import { inMemoryCommerce } from "./fixtures";
import {
  LoyaltyModule,
  LoyaltyPointsController,
  LoyaltyWriteController,
  UnservedController,
  UnservedModule,
} from "./shop-features";

const fixture = inMemoryCommerce({
  id: "local",
  also: ["search", "cms", "psp"],
  cartFields: true,
});
/** The fixture with its cart hook marked (the fixture keeps the fields itself). */
const shop = { ...fixture, mappers: { cart: true } };

let app: Awaited<ReturnType<typeof boot>>;
const jar: Jar = {};

beforeAll(async () => {
  useConfig(() =>
    defineConfig({
      commerce: shop,
      search: shop,
      cms: shop,
      psp: shop,
      contracts: {
        cart: CartResponseSchema.extend({
          giftMessage: z.string().trim().max(500).optional(),
          // decided by the server (a feature module, a hook), never by the shopper
          loyaltyTier: z.string().optional(),
        }),
      },
      cartFields: ["giftMessage"],
      features: [LoyaltyModule, UnservedModule],
    }),
  );
  exactEnv({ ...CORE_ENV });
  app = await boot();
});
afterAll(() => app?.close());

const carts = async () =>
  (await request(app, jar)).get(bff("features/cart/cart.service").CartService);

describe("a field the shopper sets, through SHOPin's cart fields route", () => {
  it("takes exactly the cart fields the shop opens to shoppers (cartFields), checked by its contract (null removes one)", () => {
    const { CartFieldsSchema } = bff("data-source/contracts");
    expect(CartFieldsSchema.parse({ giftMessage: "  Hi " })).toEqual({
      giftMessage: "Hi",
    });
    expect(CartFieldsSchema.parse({ giftMessage: null })).toEqual({
      giftMessage: null,
    });
    for (const refused of [
      { giftMessage: "x".repeat(501) },
      { giftMessage: 3 },
      { loyaltyTier: "gold" },
      { cartId: "someone-elses" },
      { id: "c-2" },
      { lineItems: [] },
    ]) {
      expect(CartFieldsSchema.safeParse(refused).success).toBe(false);
    }
  });

  it("the route validates its body with that schema and asks for the CSRF token", () => {
    const { CartController } = bff("features/cart/cart.controller");
    const { CsrfGuard } = bff("features/csrf/csrf.guard");
    const guards = Reflect.getMetadata(
      "__guards__",
      CartController.prototype.setFields,
    );
    expect(guards).toContain(CsrfGuard);
  });

  it("without a cart there is nothing to write to (404)", async () => {
    await expect(
      (await carts()).setFields({ giftMessage: "Hi" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("writes to the shopper's own cart, which the BFF found in its sealed cookie", async () => {
    const cart = await (await carts()).createCart();
    await (await carts()).setFields({ giftMessage: "Happy birthday" });
    expect(fixture.state.carts.find((c) => c.id === cart.id)?.fields).toEqual({
      giftMessage: "Happy birthday",
    });
    expect(fixture.state.calls).toContain(`setCartFields ${cart.id} as guest`);
  });
});

describe("shop routes in a module a listed feature imports", () => {
  it("get the CSRF guard: in an imported module and in a dynamic module", () => {
    const { CsrfOnWritesGuard } = bff("features/csrf/csrf.guard");
    for (const controller of [
      LoyaltyWriteController,
      LoyaltyPointsController,
    ]) {
      expect(Reflect.getMetadata("__guards__", controller)).toContain(
        CsrfOnWritesGuard,
      );
      expect(app.get(controller, { strict: false })).toBeDefined();
    }
  });

  it("are checked for @Reads: a module whose imported route reads an unserved kind stays unmounted", () => {
    expect(() => app.get(UnservedController, { strict: false })).toThrow();
  });
});
