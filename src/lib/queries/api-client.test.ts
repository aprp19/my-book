import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderError } from "@/lib/providers/errors";
import { apiGet } from "@/lib/queries/api-client";

describe("apiGet", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns data on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: "1" }] }), { status: 200 }),
    );

    const result = await apiGet<{ id: string }[]>("/api/search?q=test");
    expect(result).toEqual([{ id: "1" }]);
  });

  it("throws ProviderError on API error body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "MANGA_NOT_FOUND", message: "Not found" },
        }),
        { status: 404 },
      ),
    );

    await expect(apiGet("/api/manga/mgeko/missing")).rejects.toMatchObject({
      code: "MANGA_NOT_FOUND",
      message: "Not found",
    });
  });

  it("throws ProviderError on invalid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not json", { status: 502 }),
    );

    await expect(apiGet("/api/browse")).rejects.toBeInstanceOf(ProviderError);
    await expect(apiGet("/api/browse")).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
    });
  });

  it("throws when data is missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await expect(apiGet("/api/search?q=x")).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});
