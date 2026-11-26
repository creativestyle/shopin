/**
 * Connector fit: what a commerce platform like Medusa's store API needs from the core, without a SHOPin file
 * changed. `store` cannot list a customer's carts (it attaches the guest cart at sign-in, `attachGuestCart`), keeps
 * guest orders together (any guest could read any guest order through it), and has no wishlists (`omits`). The
 * BFF keeps the guest cart, guards guest orders and answers 501 for the wishlist; capabilities say so.
 */
import {
  CORE_ENV,
  exactEnv,
  boot,
  request,
  useConfig,
  bff,
  idIn,
  type Jar,
} from "./harness";
import { defineConfig } from "@core/integration-kit";
import { fakeIdp, inMemoryCommerce, IDP_PASSWORD } from "./fixtures";

const store = inMemoryCommerce({
  id: "store",
  also: ["search", "cms"],
  customers: true,
  unlistedCarts: true,
  attach: true,
  noWishlist: true,
  omits: ["wishlist"],
});
const idp = fakeIdp({ id: "fake-idp" });

let app: Awaited<ReturnType<typeof boot>>;

beforeAll(async () => {
  useConfig(() =>
    defineConfig({ commerce: store, search: store, cms: store, auth: idp }),
  );
  exactEnv({ ...CORE_ENV });
  app = await boot();
});
afterAll(() => app?.close());

/** Signs in through the controller (sign-in, cart and wishlist setup), as the storefront does. */
async function signIn(jar: Jar, email: string) {
  const { AuthController } = bff("features/auth/auth.controller");
  const r = await request(app, jar);
  return (await r.get(AuthController)).login(r.req, {
    email,
    password: IDP_PASSWORD,
  });
}

async function guestCart(jar: Jar) {
  const { CartService } = bff("features/cart/cart.service");
  return (await (await request(app, jar)).get(CartService)).createCart();
}

describe("sign-in on a platform that cannot list a customer's carts", () => {
  it("attaches the guest cart to the customer through the port and keeps it", async () => {
    const jar: Jar = {};
    const cart = await guestCart(jar);
    store.state.calls.length = 0;
    expect(await signIn(jar, "alice@example.com")).toEqual({ success: true });
    // the take-over first, while the guest token is still there; the empty guest cart then defers to an active
    // cart the platform cannot list (none), so the guest cart stays the customer's
    expect(store.state.calls).toEqual([
      `attachGuestCart ${cart.id} as store-customer-1`,
      "getActiveCart as store-customer-1",
    ]);
    expect(await idIn(jar, "cart-logged.store-USD")).toBe(cart.id);
    expect(jar["cart-guest.store-USD"]).toBeUndefined();
    expect(store.state.carts.find((c) => c.id === cart.id)!.customerId).toBe(
      "store-customer-1",
    );
  });

  it("a guest cart of another customer is dropped: the platform refuses it, the customer starts without a cart", async () => {
    const jar: Jar = {};
    const cart = await guestCart(jar);
    // the cart went to another customer meanwhile (the cookie was copied, or the shopper signed in elsewhere)
    store.state.carts.find((c) => c.id === cart.id)!.customerId = "someone";
    expect(await signIn(jar, "carol@example.com")).toEqual({ success: true });
    expect(jar["cart-logged.store-USD"]).toBeUndefined();
    expect(jar["cart-guest.store-USD"]).toBeUndefined();
    expect(store.state.carts.find((c) => c.id === cart.id)!.customerId).toBe(
      "someone",
    );
  });
});

describe("guest orders", () => {
  it("a guest reads the order it placed, and no other guest's order (even where the platform would hand it out)", async () => {
    const { OrderService } = bff("features/order/order.service");
    const jar: Jar = {};
    const cart = await guestCart(jar);
    const order = await (
      await (await request(app, jar)).get(OrderService)
    ).createOrder({ cartId: cart.id });
    // the confirmation page
    expect(
      (
        await (
          await (await request(app, jar)).get(OrderService)
        ).getOrder(order.id)
      ).id,
    ).toBe(order.id);
    // another browser, a guest too: refused before the platform is asked
    store.state.calls.length = 0;
    await expect(
      (await (await request(app, {})).get(OrderService)).getOrder(order.id),
    ).rejects.toMatchObject({ status: 404 });
    expect(store.state.calls).toEqual([]);
    // the guest's cookie is encrypted and short-lived
    expect(jar["shopin-guest-order.store"]).not.toContain(order.id);
  });
});

describe("a platform without wishlists", () => {
  it("capabilities say so; the wishlist answers 501; sign-in still works", async () => {
    const { CapabilitiesController } = bff(
      "features/capabilities/capabilities.controller",
    );
    const { WishlistService } = bff("features/wishlist/wishlist.service");
    const jar: Jar = {};
    const r = await request(app, jar);
    expect(
      (await r.get(CapabilitiesController)).getCapabilities(),
    ).toMatchObject({ services: { wishlist: false } });
    const wishlist = await r.get(WishlistService);
    await expect(wishlist.getWishlist()).rejects.toMatchObject({ status: 501 });
    await expect(
      wishlist.addToWishlist({ productId: "p-1" }),
    ).rejects.toMatchObject({ status: 501 });
    expect(await signIn(jar, "alice@example.com")).toEqual({ success: true });
    expect(Object.keys(jar).filter((k) => k.startsWith("wishlist"))).toEqual(
      [],
    );
  });
});
