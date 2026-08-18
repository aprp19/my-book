import { describe, expect, it } from "vitest";
import { ProviderError } from "@/lib/providers/errors";
import { getProvider, isMangaProviderType } from "@/lib/providers/registry";

describe("provider registry", () => {
  it("returns mgeko provider", () => {
    expect(getProvider("mgeko").type).toBe("mgeko");
  });

  it("exposes browse on mgeko", () => {
    expect(getProvider("mgeko").browse).toBeDefined();
    expect(getProvider("anilist").browse).toBeUndefined();
  });

  it("rejects invalid provider type", () => {
    expect(isMangaProviderType("invalid")).toBe(false);
    expect(isMangaProviderType("comick")).toBe(false);
    expect(isMangaProviderType("mangadex")).toBe(false);
    expect(() => getProvider("invalid" as "mgeko")).toThrow(ProviderError);
  });

  it("validates mgeko and anilist as valid provider types", () => {
    expect(isMangaProviderType("mgeko")).toBe(true);
    expect(isMangaProviderType("anilist")).toBe(true);
  });
});
