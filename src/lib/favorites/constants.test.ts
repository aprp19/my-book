import { describe, expect, it } from "vitest";
import {
  FAVORITES_PAGE_SIZE,
  favoritesPageCount,
  parseFavoritesPage,
} from "./constants";

describe("favorites pagination", () => {
  it("parses page numbers", () => {
    expect(parseFavoritesPage(null)).toBe(1);
    expect(parseFavoritesPage("")).toBe(1);
    expect(parseFavoritesPage("2")).toBe(2);
    expect(parseFavoritesPage("0")).toBe(1);
    expect(parseFavoritesPage("abc")).toBe(1);
  });

  it("computes page count", () => {
    expect(favoritesPageCount(0)).toBe(1);
    expect(favoritesPageCount(1)).toBe(1);
    expect(favoritesPageCount(FAVORITES_PAGE_SIZE)).toBe(1);
    expect(favoritesPageCount(FAVORITES_PAGE_SIZE + 1)).toBe(2);
    expect(favoritesPageCount(100)).toBe(Math.ceil(100 / FAVORITES_PAGE_SIZE));
  });
});
