import { describe, expect, it } from "vitest";
import { sortFavoritesByChapterUpdate } from "./sort-favorites";

describe("sortFavoritesByChapterUpdate", () => {
  it("sorts by latest chapter update, then created_at", () => {
    const sorted = sortFavoritesByChapterUpdate([
      {
        id: "1",
        user_id: "u",
        provider: "mgeko",
        external_manga_id: "old",
        title: "Old",
        cover_url: null,
        created_at: "2026-01-01T00:00:00.000Z",
        lastChapterUpdatedAt: "2026-01-10T00:00:00.000Z",
        latestChapterId: "old-ch-1",
        hasNewChapter: false,
      },
      {
        id: "2",
        user_id: "u",
        provider: "mgeko",
        external_manga_id: "new",
        title: "New",
        cover_url: null,
        created_at: "2026-01-05T00:00:00.000Z",
        lastChapterUpdatedAt: "2026-08-18T00:00:00.000Z",
        latestChapterId: "new-ch-1",
        hasNewChapter: true,
      },
      {
        id: "3",
        user_id: "u",
        provider: "mgeko",
        external_manga_id: "none",
        title: "None",
        cover_url: null,
        created_at: "2026-02-01T00:00:00.000Z",
        lastChapterUpdatedAt: null,
        latestChapterId: null,
        hasNewChapter: false,
      },
    ]);

    expect(sorted.map((row) => row.external_manga_id)).toEqual(["new", "old", "none"]);
  });
});
