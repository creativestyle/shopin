/**
 * S3 (continued): sign-in through an external identity provider needs a commerce port that can link
 * customers. A shop that pairs one with a commerce platform without `customers` does not boot. Its own file:
 * the config mock of s3-auth-swap.spec.ts is cached in that file's module registry.
 */
import { CORE_ENV, exactEnv, boot, useConfig } from "./harness";
import { defineConfig } from "@core/integration-kit";
import { fakeIdp, inMemoryCommerce } from "./fixtures";

describe("S3: a commerce platform that cannot link customers", () => {
  it("refuses to boot with an external identity provider", async () => {
    const plain = inMemoryCommerce({ id: "plain" });
    useConfig(() =>
      defineConfig({ commerce: plain, auth: fakeIdp({ id: "fake-idp" }) }),
    );
    exactEnv({ ...CORE_ENV });
    const err = (await boot().catch((e: Error) => e)) as Error;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe(
      'shopin.config: sign-in through "fake-idp" needs the commerce integration to link customer accounts, and "plain" does not (its README says whether a setting allows it)',
    );
  });
});
