import type { OpenAPI3 } from "openapi-typescript";
import { describe, expect, it } from "vitest";
import { setupTest, testNitro } from "../tests";

describe("nitro:preset:nitro-dev", async () => {
  const ctx = await setupTest("nitro-dev");
  testNitro(
    ctx,
    () => {
      return async ({ url, headers, method, body }) => {
        const res = await ctx.fetch(url, {
          headers,
          method,
          body,
        });
        return res;
      };
    },
    (_ctx, callHandler) => {
      it("returns correct status for devProxy", async () => {
        const { status } = await callHandler({ url: "/proxy/example" });
        expect(status).toBe(200);
      });

      it("dev storage", async () => {
        const { data } = await callHandler({ url: "/api/storage/src" });
        expect(data.keys.length).toBeGreaterThan(0);
        expect(data.keys).includes("src:nitro.config.ts");
      });

      it("static asset headers", async () => {
        const { headers } = await ctx.fetch("/build/test.txt");
        expect(Object.fromEntries(headers)).toMatchObject({
          "accept-ranges": "bytes",
          "cache-control": "public, max-age=0",
          "last-modified": expect.any(String),
          etag: 'W/"7-18df5a508c5"',
          "content-type": "text/plain; charset=UTF-8",
          "content-length": "7",
          date: expect.any(String),
          connection: "keep-alive",
          "keep-alive": "timeout=5",
          "x-build-header": "works",
        });
      });

      describe("openAPI", () => {
        let spec: OpenAPI3;
        it("/_openapi.json", async () => {
          spec = ((await callHandler({ url: "/_openapi.json" })) as any).data;
          expect(spec.openapi).to.match(/^3\.\d+\.\d+$/);
          expect(spec.info.title).toBe("Nitro Test Fixture");
          expect(spec.info.description).toBe("Nitro Test Fixture API");
        });

        it("defineRouteMeta works", () => {
          expect(spec.paths?.["/api/meta/test"]).toMatchInlineSnapshot(`
            {
              "get": {
                "description": "Test route description",
                "parameters": [
                  {
                    "in": "query",
                    "name": "test",
                    "required": true,
                  },
                ],
                "responses": {
                  "200": {
                    "description": "OK",
                  },
                },
                "tags": [
                  "test",
                ],
              },
            }
          `);
        });
      });
    }
  );
});
