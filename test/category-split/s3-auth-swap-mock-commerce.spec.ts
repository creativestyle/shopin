/**
 * #345 criterion 13 against a real commerce integration: the shop's real config (config/shop), whose sign-in is the
 * mock identity provider, an outside provider like Auth0, over SHOPin's mock commerce, driven over HTTP like the
 * storefront. Sign-in links a mock customer, the guest cart survives it, and cart, account and order calls act
 * for the customer id in SHOPin's session: a customer id the request carries (header, query, body) is ignored.
 */
import { CORE_ENV, exactEnv, boot, http } from "./harness";

type Server = Awaited<ReturnType<typeof http>>;

/** One browser: its cookies and CSRF token, sent with every request it makes. */
function browser(server: Server) {
  const jar = new Map<string, string>();
  let csrf = "";
  const send = async (
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ) => {
    const res = await server.fetch(path, {
      method,
      headers: {
        "content-type": "application/json",
        "accept-language": "en-US",
        cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
        ...(csrf ? { "x-csrf-token": csrf } : {}),
        ...headers,
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
    csrf: async () => {
      csrf = (await send("GET", "/bff/csrf/token")).body.token;
    },
    addToCart: async (body: Record<string, unknown> = {}) => {
      const search = await send(
        "GET",
        "/bff/productSearch?query=shirt&limit=1",
      );
      return send("POST", "/bff/cart/items", {
        productId: search.body.products[0].id,
        quantity: 1,
        ...body,
      });
    },
    signIn: async (email: string, password: string) => {
      const res = await send("POST", "/bff/auth/login", { email, password });
      // the signed-in session gets its own CSRF token, as the storefront fetches it
      csrf = (await send("GET", "/bff/csrf/token")).body.token;
      return res;
    },
  };
}

let server: Server;
let password: string;

/** What the payment provider confirms for a browser's cart: its total now, as the mock's pretend page sends it back. */
async function paidTotal(b: ReturnType<typeof browser>) {
  const { grandTotal } = (await b.send("GET", "/bff/cart")).body;
  return {
    amount: String(grandTotal.regularPriceInCents),
    currency: grandTotal.currency,
  };
}

beforeAll(async () => {
  // the shop's real config: mock commerce and psp, sign-in by the mock identity provider, which stands in for an
  // outside provider such as Auth0 (its own id, not commerce's: no own-platform hand-over)
  jest.dontMock("@shopin/config");
  password = "mock-password";
  exactEnv({ ...CORE_ENV });
  server = await http(await boot());
});
afterAll(() => server?.close());

describe("S3 over mock commerce: another identity provider, no commerce code changed", () => {
  it("sign-in links a mock customer; the guest cart survives; cart, account and order act for the session's customer only", async () => {
    // carol: another customer, with an order of her own
    const carol = browser(server);
    await carol.csrf();
    expect((await carol.signIn("carol@example.com", password)).status).toBe(
      200,
    );
    const carolId = (await carol.send("GET", "/bff/customer/me")).body.id;
    expect(carolId).toEqual(expect.stringMatching(/^mock-customer-/));
    const carolCart = (await carol.addToCart()).body.id;
    const carolOrder = (
      await carol.send("POST", "/bff/payment/return", {
        paymentId: carolCart,
        params: { result: "paid", ...(await paidTotal(carol)) },
      })
    ).body.orderId;
    expect(carolOrder).toEqual(expect.any(String));

    // alice: a guest cart, then sign-in through the identity provider
    const alice = browser(server);
    await alice.csrf();
    const guestCart = (await alice.addToCart()).body.id;
    expect((await alice.signIn("alice@example.com", password)).status).toBe(
      200,
    );
    const me = (await alice.send("GET", "/bff/customer/me")).body;
    expect(me.email).toBe("alice@example.com");
    expect(me.id).toEqual(expect.stringMatching(/^mock-customer-/));
    expect(me.id).not.toBe(carolId);
    // the guest cart is now the customer's cart
    expect((await alice.send("GET", "/bff/cart")).body.id).toBe(guestCart);

    // carol's customer id, supplied by alice's requests, is ignored: every call acts for alice
    const claim = { "x-customer-id": carolId, "x-customer": carolId };
    const forged = `customerId=${encodeURIComponent(carolId)}`;
    const meForged = await alice.send(
      "GET",
      `/bff/customer/me?${forged}`,
      undefined,
      claim,
    );
    expect(meForged.body.id).toBe(me.id);
    const cartForged = await alice.send(
      "GET",
      `/bff/cart?${forged}`,
      undefined,
      claim,
    );
    expect(cartForged.body.id).toBe(guestCart);
    const added = await alice.addToCart({ customerId: carolId });
    expect(added.body.id).toBe(guestCart);
    expect(added.body.id).not.toBe(carolCart);
    const ordersForged = await alice.send(
      "GET",
      `/bff/order?${forged}`,
      undefined,
      claim,
    );
    expect(ordersForged.status).toBe(200);
    expect(ordersForged.body.total).toBe(0);
    const carolOrderForged = await alice.send(
      "GET",
      `/bff/order/${carolOrder}?${forged}`,
      undefined,
      claim,
    );
    expect(carolOrderForged.status).toBe(404);

    // alice's own order: created for her and listed for her only
    const paid = await alice.send("POST", "/bff/payment/return", {
      paymentId: guestCart,
      params: { result: "paid", ...(await paidTotal(alice)) },
      customerId: carolId,
    });
    expect(paid.body).toEqual({ status: "paid", orderId: expect.any(String) });
    const own = await alice.send("GET", "/bff/order");
    expect(own.body.orders.map((o: { id: string }) => o.id)).toEqual([
      paid.body.orderId,
    ]);
    const carolsList = await carol.send("GET", "/bff/order");
    expect(carolsList.body.orders.map((o: { id: string }) => o.id)).toEqual([
      carolOrder,
    ]);
  });
});
