import { describe, expect, it } from "vitest";
import {
  filterChaptersByLanguage,
  isAllowedChapterLanguage,
} from "@/lib/chapters/languages";

describe("chapter languages", () => {
  it("allows en and id only", () => {
    expect(isAllowedChapterLanguage("en")).toBe(true);
    expect(isAllowedChapterLanguage("EN")).toBe(true);
    expect(isAllowedChapterLanguage("id")).toBe(true);
    expect(isAllowedChapterLanguage("ja")).toBe(false);
    expect(isAllowedChapterLanguage(null)).toBe(false);
  });

  it("filters chapter lists", () => {
    const chapters = [
      { id: "1", language: "en" },
      { id: "2", language: "ja" },
      { id: "3", language: "id" },
    ];

    expect(filterChaptersByLanguage(chapters)).toEqual([
      { id: "1", language: "en" },
      { id: "3", language: "id" },
    ]);
  });
});
