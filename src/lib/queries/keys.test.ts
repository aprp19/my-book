import { describe, expect, it } from "vitest";
import { queryKeys } from "@/lib/queries/keys";

describe("queryKeys", () => {
  it("builds stable search keys", () => {
    expect(queryKeys.search("one piece")).toEqual(["search", "one piece"]);
  });

  it("builds stable browse keys", () => {
    expect(queryKeys.browse("popular", 2)).toEqual(["browse", "popular", 2]);
  });

  it("builds stable provider keys", () => {
    expect(queryKeys.manga("mgeko", "tang-clan-legend")).toEqual([
      "manga",
      "mgeko",
      "tang-clan-legend",
    ]);
    expect(queryKeys.chapters("mgeko", "tang-clan-legend")).toEqual([
      "chapters",
      "mgeko",
      "tang-clan-legend",
    ]);
    expect(queryKeys.pages("mgeko", "abc123")).toEqual(["pages", "mgeko", "abc123"]);
  });

  it("builds stable user keys", () => {
    expect(queryKeys.favorites()).toEqual(["user", "favorites"]);
    expect(queryKeys.favorites(2)).toEqual(["user", "favorites", 2]);
    expect(queryKeys.continueReading()).toEqual(["user", "continue-reading"]);
    expect(queryKeys.recentChapters()).toEqual(["user", "recent-chapters"]);
    expect(queryKeys.recentViews()).toEqual(["user", "recent-views"]);
    expect(queryKeys.favoriteStatus("mgeko", "slug")).toEqual([
      "user",
      "favorite-status",
      "mgeko",
      "slug",
    ]);
    expect(queryKeys.readingProgress("mgeko", "ch1")).toEqual([
      "user",
      "reading-progress",
      "mgeko",
      "ch1",
    ]);
  });
});
