import { describe, expect, it } from "vitest";
import {
  normalizeTitleForMatch,
  parseMgekoBookmarkExport,
} from "./mgeko-bookmark-export";

const SAMPLE_EXPORT = `(1)
NAME: Lightning Degree
OTHER NAME: Biroe-do, Lightning Sword, Updating
 ---
(2)
NAME: Solo Leveling
OTHER NAME: I Alone Level-Up, 나 혼자만 레벨업
 ---
(3)
NAME: Study Group
OTHER NAME: 스터디그룹
 ---`;

describe("parseMgekoBookmarkExport", () => {
  it("parses NAME and OTHER NAME blocks", () => {
    const entries = parseMgekoBookmarkExport(SAMPLE_EXPORT);

    expect(entries).toHaveLength(3);
    expect(entries[0]).toEqual({
      index: 1,
      title: "Lightning Degree",
      altTitles: ["Biroe-do", "Lightning Sword"],
    });
    expect(entries[1].title).toBe("Solo Leveling");
    expect(entries[1].altTitles).toContain("I Alone Level-Up");
    expect(entries[2].title).toBe("Study Group");
  });

  it("dedupes entries with the same NAME", () => {
    const text = `(1)
NAME: Solo Leveling
OTHER NAME: 
 ---
(2)
NAME: Solo Leveling
OTHER NAME: duplicate
 ---`;

    expect(parseMgekoBookmarkExport(text)).toHaveLength(1);
  });

  it("throws when export is empty", () => {
    expect(() => parseMgekoBookmarkExport("not a bookmark file")).toThrow(
      "No bookmarks found",
    );
  });
});

describe("normalizeTitleForMatch", () => {
  it("normalizes case and whitespace", () => {
    expect(normalizeTitleForMatch("  Solo   Leveling  ")).toBe("solo leveling");
  });
});
