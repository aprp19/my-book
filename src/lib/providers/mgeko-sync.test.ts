import { describe, expect, it } from "vitest";
import {
  parseMgekoBookmarks,
  parseMgekoReadChapters,
  parseMgekoReadChaptersPage,
} from "./mgeko-sync";
import { MgekoAuthError } from "./mgeko-auth-fetch";
import { chapterNumberFromSlug, resolveMgekoChapterId } from "./mgeko-utils";

describe("resolveMgekoChapterId", () => {
  it("expands short chapter slugs from all-chapters page", () => {
    expect(
      resolveMgekoChapterId(
        "the-regressed-mercenarys-machinations",
        "102-eng-li",
      ),
    ).toBe("the-regressed-mercenarys-machinations-chapter-102-eng-li");
    expect(
      resolveMgekoChapterId(
        "the-regressed-mercenarys-machinations",
        "90-5-eng-li",
      ),
    ).toBe("the-regressed-mercenarys-machinations-chapter-90-5-eng-li");
  });
});

describe("chapterNumberFromSlug", () => {
  it("parses short and full slugs", () => {
    expect(chapterNumberFromSlug("102-eng-li")).toBe("102");
    expect(
      chapterNumberFromSlug(
        "the-regressed-mercenarys-machinations-chapter-90-5-eng-li",
      ),
    ).toBe("90.5");
  });
});

describe("parseMgekoBookmarks", () => {
  it("parses bookmark articles into unique slugs", () => {
    const html = `
      <html><body>
        <article class="comic-card">
          <a href="/manga/series-one/">
            <img src="/media/cover1.jpg" alt="Series One" />
          </a>
          <h3 class="comic-card__title"><a href="/manga/series-one/">Series One</a></h3>
        </article>
        <article class="comic-card">
          <a href="/manga/series-two/">
            <img src="https://imgsrv5.com/media/cover2.jpg" alt="Series Two" />
          </a>
          <h3 class="comic-card__title"><a href="/manga/series-two/">Series Two</a></h3>
        </article>
      </body></html>
    `;

    const bookmarks = parseMgekoBookmarks(html);
    expect(bookmarks).toHaveLength(2);
    expect(bookmarks[0].mangaId).toBe("series-one");
    expect(bookmarks[0].title).toBe("Series One");
    expect(bookmarks[0].coverUrl).toContain("avatar/288x412");
  });

  it("throws on login page HTML", () => {
    const html = `
      <html><body>
        <title>Login</title>
        <h1>Welcome Back</h1>
        <a href="/portal/api/login/">Sign in</a>
      </body></html>
    `;

    expect(() => parseMgekoBookmarks(html)).toThrow(MgekoAuthError);
  });
});

describe("parseMgekoReadChapters", () => {
  const mangaId = "the-regressed-mercenarys-machinations";

  it("parses read chapters from fa-eye markers on all-chapters page", () => {
    const html = `
      <ul class="chapter-list">
        <li>
          <a href="/reader/en/the-regressed-mercenarys-machinations-chapter-102-eng-li/">
            <strong class="chapter-title">102-eng-li</strong>
          </a>
          <i class="fas fa-eye-slash" onclick="changeViewStatus(event, '102-eng-li')"></i>
        </li>
        <li>
          <a href="/reader/en/the-regressed-mercenarys-machinations-chapter-101-eng-li/">
            <strong class="chapter-title">101-eng-li</strong>
          </a>
          <i class="fas fa-eye" onclick="changeViewStatus(event, '101-eng-li')"></i>
        </li>
        <li>
          <a href="/reader/en/the-regressed-mercenarys-machinations-chapter-100-eng-li/">
            <strong class="chapter-title">100-eng-li</strong>
          </a>
          <i class="fas fa-eye" onclick="changeViewStatus(event, '100-eng-li')"></i>
        </li>
      </ul>
    `;

    const read = parseMgekoReadChapters(html, mangaId);
    expect(read.map((c) => c.chapterId)).toEqual([
      "the-regressed-mercenarys-machinations-chapter-101-eng-li",
      "the-regressed-mercenarys-machinations-chapter-100-eng-li",
    ]);
    expect(read[0].chapterNumber).toBe("101");
  });

  it("parses read chapters when eye icon is nested inside the toggle", () => {
    const html = `
      <ul class="chapter-list">
        <li>
          <a href="/reader/en/foo-chapter-5-eng-li/"><strong class="chapter-title">5-eng-li</strong></a>
          <span onclick="changeViewStatus(event, '5-eng-li')"><i class="fas fa-eye"></i></span>
        </li>
        <li>
          <a href="/reader/en/foo-chapter-4-eng-li/"><strong class="chapter-title">4-eng-li</strong></a>
          <span onclick="changeViewStatus(event, '4-eng-li')"><i class="fas fa-eye-slash"></i></span>
        </li>
      </ul>
    `;

    const read = parseMgekoReadChapters(html, "foo");
    expect(read.map((c) => c.chapterId)).toEqual(["foo-chapter-5-eng-li"]);
  });

  it("parses read chapters from fa-solid eye icons on toggle element", () => {
    const html = `
      <ul class="chapter-list">
        <li>
          <a href="/reader/en/foo-chapter-3-eng-li/"><strong class="chapter-title">3-eng-li</strong></a>
          <i class="fa-solid fa-eye" onclick="changeViewStatus(event, '3-eng-li')"></i>
        </li>
        <li>
          <a href="/reader/en/foo-chapter-2-eng-li/"><strong class="chapter-title">2-eng-li</strong></a>
          <i class="fa-solid fa-eye-slash" onclick="changeViewStatus(event, '2-eng-li')"></i>
        </li>
      </ul>
    `;

    const read = parseMgekoReadChapters(html, "foo");
    expect(read.map((c) => c.chapterId)).toEqual(["foo-chapter-3-eng-li"]);
  });

  it("parses read chapters from global changeViewStatus toggles outside li", () => {
    const html = `
      <div class="chapter-grid">
        <a href="/reader/en/bar-chapter-7-eng-li/">Ch 7</a>
        <i class="fas fa-eye" onclick="changeViewStatus(event, '7-eng-li')"></i>
      </div>
    `;

    const read = parseMgekoReadChapters(html, "bar");
    expect(read.map((c) => c.chapterId)).toEqual(["bar-chapter-7-eng-li"]);
  });

  it("detects when all-chapters HTML lacks logged-in view markers", () => {
    const html = `
      <ul class="chapter-list">
        <li>
          <a href="/reader/en/foo-chapter-1-eng-li/"><strong class="chapter-title">1-eng-li</strong></a>
        </li>
      </ul>
    `;

    const { chapters, chapterRowCount, hasViewMarkers } =
      parseMgekoReadChaptersPage(html, "foo");
    expect(chapters).toEqual([]);
    expect(chapterRowCount).toBe(1);
    expect(hasViewMarkers).toBe(false);
  });

  it("still supports visited list item class markers", () => {
    const html = `
      <ul class="chapter-list">
        <li class="visited">
          <a href="/reader/en/foo-chapter-10-eng-li/">Ch. 10</a>
        </li>
        <li>
          <a href="/reader/en/foo-chapter-9-eng-li/">Ch. 9</a>
        </li>
      </ul>
    `;

    const read = parseMgekoReadChapters(html, "foo");
    expect(read.map((c) => c.chapterId)).toEqual(["foo-chapter-10-eng-li"]);
  });

  it("returns empty when logged out (no read markers)", () => {
    const html = `
      <ul class="chapter-list">
        <li>
          <a href="/reader/en/the-regressed-mercenarys-machinations-chapter-102-eng-li/">
            <strong class="chapter-title">102-eng-li</strong>
          </a>
        </li>
      </ul>
    `;

    expect(parseMgekoReadChapters(html, mangaId)).toEqual([]);
  });
});
