import { describe, expect, it } from "vitest";
import {
  formatChapterReleaseDate,
  parseProviderDate,
} from "./date";

describe("parseProviderDate", () => {
  it("parses mgeko human-readable datetime", () => {
    const date = parseProviderDate("Aug. 18, 2026, 3:22 a.m.");
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(7);
    expect(date?.getDate()).toBe(18);
    expect(date?.getHours()).toBe(3);
    expect(date?.getMinutes()).toBe(22);
  });

  it("parses ISO strings", () => {
    const date = parseProviderDate("2026-01-15T12:00:00.000Z");
    expect(date?.toISOString()).toBe("2026-01-15T12:00:00.000Z");
  });

  it("returns null for empty input", () => {
    expect(parseProviderDate(null)).toBeNull();
    expect(parseProviderDate("")).toBeNull();
  });
});

describe("formatChapterReleaseDate", () => {
  it("formats mgeko dates as relative text", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 5);
    const label = formatChapterReleaseDate(recent.toISOString());
    expect(label).toMatch(/5 days ago|day/);
  });
});
