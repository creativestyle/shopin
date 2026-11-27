/**
 * The shop's real config (config/shop, `@shopin/config`, no mock of it), booted as the BFF runs it and driven over
 * HTTP like the storefront does (CSRF token, cookies): the payment return route `POST /bff/payment/return` creates an
 * order only for a paid or authorized result of the shopper's own cart, paid at the cart's total. Every other result
 * (failed, cancelled, pending), a paid result for another shopper's cart and a payment for a cart that changed after
 * the payment started order nothing: the cart stays the shopper's active cart. A reload of the return page after the
 * order answers with the same order, and only in the session that placed it; so does a Retry after the answer that
 * placed it was lost (commerce holds the order, no cookie of that answer is needed). (#345 criterion 33.)
 * The payment integration decides the result; the request only carries what the provider sent back.
 */
import { CORE_ENV, exactEnv, boot, http } from "./harness";

type Server = Awaited<ReturnType<typeof http>>;

/** One browser: its cookies and CSRF token, sent with every request it makes. */
function shopper(server: Server) {
  const jar = new Map<string, string>();
  let csrf = "";
  /** `lost`: the response never reaches the browser (a dropped connection): its cookies are not kept. */
  const send = async (
    method: string,
    path: string,
    body?: unknown,
    { lost = false } = {},
  ) => {
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
    for (const cookie of lost ? [] : res.cookies) {
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
    /**
     * Starts paying as the checkout does (a method, then the provider's link): the amount and currency the mock's
     * pretend page was opened for, which it sends back as the amount it charged.
     */
    async initiate(cartId: string): Promise<Record<string, string>> {
      const method = await send("PUT", "/bff/payment/method", {
        paymentMethodId: "invoice",
        provider: "mocked",
        paymentMethodName: "Invoice",
      });
      expect(method.status).toBe(200);
      // the method's payment integration is the cart's payment provider (one name in the contracts)
      expect(method.body.paymentInfo).toMatchObject({
        method: "invoice",
        provider: "mocked",
      });
      const started = await send("POST", "/bff/payment/initiate", { cartId });
      expect(started.status).toBe(201);
      const link = new URL(started.body.paymentLink);
      return {
        amount: link.searchParams.get("amount") ?? "",
        currency: link.searchParams.get("currency") ?? "",
      };
    },
    paymentReturn: (
      paymentId: string,
      result: string,
      paid: Record<string, string> = {},
      lost = false,
    ) =>
      send(
        "POST",
        "/bff/payment/return",
        { paymentId, params: { result, ...paid } },
        { lost },
      ),
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
      const total = await alice.initiate(cart);
      const res = await alice.paymentReturn(cart, result, total);
      expect(res.status).toBe(200);
      // the payment's status as the payment integration reported it, and no order
      expect(res.body).toEqual({ status: result });
      expect(await alice.cartId()).toBe(cart);
      // the cart was not ordered: paying it now still creates its order
      const paid = await alice.paymentReturn(cart, "paid", total);
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
    const bobTotal = await bob.initiate(bobCart);
    const res = await alice.paymentReturn(bobCart, "paid", bobTotal);
    expect(res.status).toBe(200);
    expect(res.body.orderId).toBeUndefined();
    expect(res.body.status).toBe("failed");
    expect(await alice.cartId()).toBe(aliceCart);
    expect(await bob.cartId()).toBe(bobCart);
    // bob's cart was not ordered by alice's return: bob paying it creates its order
    const own = await bob.paymentReturn(bobCart, "paid", bobTotal);
    expect(own.body).toEqual({ status: "paid", orderId: expect.any(String) });
    // and alice replaying bob's paid return after his order gets neither his order nor one of her own
    const replay = await alice.paymentReturn(bobCart, "paid", bobTotal);
    expect(replay.body).toEqual({ status: "failed" });
    expect(await alice.cartId()).toBe(aliceCart);
  });

  it("a cart changed after the payment started (an item added in another tab) is not ordered against that payment", async () => {
    const alice = shopper(server);
    const cart = await alice.start();
    const total = await alice.initiate(cart);
    // another tab adds an item while the provider's page is open
    const search = await alice.send(
      "GET",
      "/bff/productSearch?query=shirt&limit=1",
    );
    const added = await alice.send("POST", "/bff/cart/items", {
      productId: search.body.products[0].id,
      quantity: 1,
    });
    expect(added.status).toBe(201);
    expect(String(added.body.grandTotal.regularPriceInCents)).not.toBe(
      total.amount,
    );
    const res = await alice.paymentReturn(cart, "paid", total);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "failed" });
    expect(await alice.cartId()).toBe(cart);
    // another currency for the same amount orders nothing either
    const otherCurrency = await alice.paymentReturn(cart, "paid", {
      amount: String(added.body.grandTotal.regularPriceInCents),
      currency: total.currency === "EUR" ? "USD" : "EUR",
    });
    expect(otherCurrency.body).toEqual({ status: "failed" });
    // and a paid result without an amount orders nothing
    expect((await alice.paymentReturn(cart, "paid")).body).toEqual({
      status: "failed",
    });
    expect(await alice.cartId()).toBe(cart);
    // paying the cart as it is now orders it
    const repaid = await alice.paymentReturn(
      cart,
      "paid",
      await alice.initiate(cart),
    );
    expect(repaid.body).toEqual({
      status: "paid",
      orderId: expect.any(String),
    });
  });

  it.each(["paid", "authorized"])(
    "%s for the shopper's own cart: its order is created, and the shopper can read it",
    async (result) => {
      const alice = shopper(server);
      const cart = await alice.start();
      const total = await alice.initiate(cart);
      const res = await alice.paymentReturn(cart, result, total);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: result, orderId: expect.any(String) });
      // the cart became the order: no active cart, the order is the shopper's
      expect(await alice.cartId()).toBeUndefined();
      const order = await alice.send("GET", `/bff/order/${res.body.orderId}`);
      expect(order.status).toBe(200);
      expect(order.body.id).toBe(res.body.orderId);
      // a reload of the return page (or Retry after a lost answer) gets the same order, never 'failed', and
      // orders nothing more
      const again = await alice.paymentReturn(cart, result, total);
      expect(again.body).toEqual({ status: result, orderId: res.body.orderId });
      expect(await alice.cartId()).toBeUndefined();
      // another browser replaying the same return gets nothing of alice's order
      const bob = shopper(server);
      await bob.start();
      const replay = await bob.paymentReturn(cart, result, total);
      expect(replay.body).toEqual({ status: "failed" });
    },
  );

  it("the answer that placed the order is lost: Retry gets that order (no second order, no 'failed'), and the shopper can read it", async () => {
    const alice = shopper(server);
    const cart = await alice.start();
    const total = await alice.initiate(cart);
    const lost = await alice.paymentReturn(cart, "paid", total, true);
    expect(lost.body).toEqual({ status: "paid", orderId: expect.any(String) });
    // the browser still holds the cart cookie the lost answer cleared, and nothing of the order
    const retry = await alice.paymentReturn(cart, "paid", total);
    expect(retry.status).toBe(200);
    expect(retry.body).toEqual({ status: "paid", orderId: lost.body.orderId });
    expect(await alice.cartId()).toBeUndefined();
    const order = await alice.send("GET", `/bff/order/${lost.body.orderId}`);
    expect(order.status).toBe(200);
    // another browser replaying the same return gets nothing of it
    const bob = shopper(server);
    await bob.start();
    expect((await bob.paymentReturn(cart, "paid", total)).body).toEqual({
      status: "failed",
    });
  });
});
