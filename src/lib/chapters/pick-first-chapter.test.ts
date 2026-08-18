import { describe, expect, it } from "vitest";
import { pickFirstChapter } from "@/lib/chapters/pick-first-chapter";
import type { Chapter } from "@/types";

function chapter(number: string | null, id = number ?? "x"): Chapter {
  return {
    id,
    mangaId: "m1",
    provider: "mgeko",
    number,
    title: null,
    volume: null,
    language: "en",
    publishedAt: null,
  };
}

describe("pickFirstChapter", () => {
  it("returns null for empty list", () => {
    expect(pickFirstChapter([])).toBeNull();
  });

  it("picks lowest numeric chapter", () => {
    const chapters = [chapter("10", "c10"), chapter("1", "c1"), chapter("5", "c5")];
    expect(pickFirstChapter(chapters)?.id).toBe("c1");
  });

  it("handles decimal chapters", () => {
    const chapters = [chapter("90.5", "c905"), chapter("90", "c90"), chapter("91", "c91")];
    expect(pickFirstChapter(chapters)?.id).toBe("c90");
  });

  it("treats null number as zero", () => {
    const chapters = [chapter("1", "c1"), chapter(null, "c0")];
    expect(pickFirstChapter(chapters)?.id).toBe("c0");
  });
});
