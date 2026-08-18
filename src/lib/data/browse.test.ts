import { describe, expect, it } from "vitest";
import {
  buildBrowsePageUrl,
  parseBrowsePage,
  parseBrowsePages,
} from "@/lib/data/browse-shared";

describe("browse pagination", () => {
  it("defaults invalid page values to 1", () => {
    expect(parseBrowsePage(undefined)).toBe(1);
    expect(parseBrowsePage("0")).toBe(1);
    expect(parseBrowsePage("-3")).toBe(1);
    expect(parseBrowsePage("abc")).toBe(1);
  });

  it("caps page values at the maximum", () => {
    expect(parseBrowsePage("999")).toBe(50);
  });

  it("parses feed pages from search params", () => {
    expect(
      parseBrowsePages({
        recent: "2",
        updates: "3",
        popular: "1",
      }),
    ).toEqual({
      "recently-added": 2,
      "latest-updates": 3,
      popular: 1,
    });
  });

  it("builds home URLs while preserving other feed pages", () => {
    const pages = {
      "recently-added": 2,
      "latest-updates": 1,
      popular: 3,
    };

    expect(buildBrowsePageUrl("recently-added", 3, pages)).toBe(
      "/?recent=3&popular=3",
    );
    expect(buildBrowsePageUrl("latest-updates", 2, pages)).toBe(
      "/?recent=2&updates=2&popular=3",
    );
    expect(buildBrowsePageUrl("popular", 1, pages)).toBe("/?recent=2");
  });
});
