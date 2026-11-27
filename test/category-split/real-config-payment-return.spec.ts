/**
 * The shop's real config (config/shop, `@shopin/config`, no mock of it), booted as the BFF runs it and driven over
 * HTTP like the storefront does (CSRF token, cookies): the payment return route `POST /bff/payment/return` creates an
 * order only for a paid or authorized result of the shopper's own cart. Every other result (failed, cancelled, pending) and a paid
 * result for another shopper's cart order nothing: the cart stays the shopper's active cart. (#345 criterion 33.)
 * The payment integration decides the result; the request only carries what the provider sent back.
 */
import { CORE_ENV, exactEnv, boot, http } from "./harness";

type Server = Awaited<ReturnType<typeof http>>;

/** One browser: its cookies and CSRF token, sent with every request it makes. */
function shopper(server: Server) {
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
      const value = cookie.slice(at + 1);
      if (value) jar.set(cookie.slice(0, at), value);
      else jar.delete(cookie.slice(0, at));
    }
    return res;
  };
  return {
    send,
    async start() {
      csrf = (await send("GET", "/bff/csrf/token")).body.token;
      const search = await send(
        "GET",
        "/bff/productSearch?query=shirt&limit=1",
      );
      const productId = search.body.products[0].id;
      const added = await send("POST", "/bff/cart/items", {
        productId,
        quantity: 1,
      });
      expect(added.status).toBe(201);
      return added.body.id as string;
    },
    cartId: async () => (await send("GET", "/bff/cart")).body?.id,
    paymentReturn: (paymentId: string, result: string) =>
      send("POST", "/bff/payment/return", { paymentId, params: { result } }),
  };
}

let server: Server;

beforeAll(async () => {
  exactEnv({ ...CORE_ENV });
  server = await http(await boot());
});
afterAll(() => server?.close());

describe("config/shop: the payment return route", () => {
  it.each(["failed", "cancelled", "pending"])(
    "%s: no order; the cart stays the shopper's active cart",
    async (result) => {
      const alice = shopper(server);
      const cart = await alice.start();
      const res = await alice.paymentReturn(cart, result);
      expect(res.status).toBe(200);
      // the payment's status as the payment integration reported it, and no order
      expect(res.body).toEqual({ status: result });
      expect(await alice.cartId()).toBe(cart);
      // the cart was not ordered: paying it now still creates its order
      const paid = await alice.paymentReturn(cart, "paid");
      expect(paid.body).toEqual({
        status: "paid",
        orderId: expect.any(String),
      });
    },
  );

  it("a paid result for another shopper's cart orders neither cart", async () => {
    const alice = shopper(server);
    const bob = shopper(server);
    const aliceCart = await alice.start();
    const bobCart = await bob.start();
    const res = await alice.paymentReturn(bobCart, "paid");
    expect(res.status).toBe(200);
    expect(res.body.orderId).toBeUndefined();
    expect(res.body.status).toBe("failed");
    expect(await alice.cartId()).toBe(aliceCart);
    expect(await bob.cartId()).toBe(bobCart);
    // bob's cart was not ordered by alice's return: bob paying it creates its order
    const own = await bob.paymentReturn(bobCart, "paid");
    expect(own.body).toEqual({ status: "paid", orderId: expect.any(String) });
  });

  it.each(["paid", "authorized"])(
    "%s for the shopper's own cart: its order is created, and the shopper can read it",
    async (result) => {
      const alice = shopper(server);
      const cart = await alice.start();
      const res = await alice.paymentReturn(cart, result);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: result, orderId: expect.any(String) });
      // the cart became the order: no active cart, the order is the shopper's
      expect(await alice.cartId()).toBeUndefined();
      const order = await alice.send("GET", `/bff/order/${res.body.orderId}`);
      expect(order.status).toBe(200);
      expect(order.body.id).toBe(res.body.orderId);
      // paying the same cart again orders nothing more
      const again = await alice.paymentReturn(cart, result);
      expect(again.body.orderId).toBeUndefined();
    },
  );
});
