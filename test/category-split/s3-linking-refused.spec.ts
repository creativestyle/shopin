/**
 * S3 (continued): sign-in through an external identity provider needs a commerce port that can link
 * customers. A shop that pairs one with a commerce platform without `customers` does not boot; so does one whose
 * sign-in may only pair with it under another id. The platform's own sign-in links nothing and boots. Its own file:
 * the config mock of s3-auth-swap.spec.ts is cached in that file's module registry.
 */
import { CORE_ENV, exactEnv, boot, useConfig, loaded } from "./harness";
import type { fakeIdp } from "./fixtures";

describe("S3: a commerce platform that cannot link customers", () => {
  /** Boots `plain` (no `customers`) with a sign-in `fakeIdp(options)` in a fresh registry: the error, or none. */
  async function bootWith(
    options: Parameters<typeof fakeIdp>[0],
  ): Promise<{ error?: string; ports?: string[] }> {
    let out: { error?: string; ports?: string[] } = {};
    await jest.isolateModulesAsync(async () => {
      const fx: typeof import("./fixtures") = require("./fixtures");
      const kit: typeof import("@core/integration-kit") = require("@core/integration-kit");
      const plain = fx.inMemoryCommerce({ id: "plain" });
      useConfig(() =>
        kit.defineConfig({ commerce: plain, auth: fx.fakeIdp(options) }),
      );
      exactEnv({ ...CORE_ENV });
      try {
        const app = await boot();
        out = { ports: loaded() };
        await app.close();
      } catch (e) {
        out = { error: (e as Error).message };
      }
    });
    return out;
  }

  const pairsWithPlain = {
    auth: { needs: { commerce: "plain" }, reason: "plain customers only" },
  };

  it("refuses to boot with an external identity provider", async () => {
    expect(await bootWith({ id: "fake-idp" })).toEqual({
      error:
        'shopin.config: sign-in through "fake-idp" needs the commerce integration to link customer accounts, and "plain" does not (its README says whether a setting allows it)',
    });
  });

  it("refuses to boot with a sign-in that may only pair with it under another id: it links like any other", async () => {
    expect(
      await bootWith({ id: "plain-idp", requires: pairsWithPlain }),
    ).toEqual({
      error:
        'shopin.config: sign-in through "plain-idp" needs the commerce integration to link customer accounts, and "plain" does not (its README says whether a setting allows it)',
    });
  });

  it("refuses to boot with a part of its provider whose descriptor does not require it: it links like any other", async () => {
    expect(await bootWith({ id: "plain" })).toEqual({
      error:
        'shopin.config: sign-in through "plain" needs the commerce integration to link customer accounts, and "plain" does not (its README says whether a setting allows it)',
    });
  });

  it("boots with the platform's own sign-in (same provider, its descriptor requires it): nothing to link", async () => {
    expect(await bootWith({ id: "plain", requires: pairsWithPlain })).toEqual({
      ports: ["commerce:plain", "auth:plain"],
    });
  });
});
