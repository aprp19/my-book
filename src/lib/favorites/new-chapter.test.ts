import { describe, expect, it } from "vitest";
import { computeHasNewChapter } from "./new-chapter";

describe("computeHasNewChapter", () => {
  it("returns false when there is no latest chapter", () => {
    expect(computeHasNewChapter(null, new Set(["ch-1"]), true)).toBe(false);
  });

  it("returns false when the latest chapter is already read", () => {
    expect(
      computeHasNewChapter("ch-10", new Set(["ch-9", "ch-10"]), true),
    ).toBe(false);
  });

  it("returns false when latest is unread but user never started the series", () => {
    expect(computeHasNewChapter("ch-10", new Set(), false)).toBe(false);
  });

  it("returns true when user has progress and latest chapter is unread", () => {
    expect(
      computeHasNewChapter("ch-10", new Set(["ch-9", "ch-8"]), true),
    ).toBe(true);
  });
});
