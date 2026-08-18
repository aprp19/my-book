import { describe, expect, it } from "vitest";
import {
  parseMgekoBookmarks,
  parseMgekoReadChapters,
} from "./mgeko-sync";
import { MgekoAuthError } from "./mgeko-auth-fetch";

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
  it("parses read chapter slugs from visited list items", () => {
    const html = `
      <ul class="chapter-list">
        <li class="visited">
          <a href="/reader/en/foo-chapter-10-eng-li/">Ch. 10</a>
        </li>
        <li>
          <a href="/reader/en/foo-chapter-9-eng-li/">Ch. 9</a>
        </li>
        <li class="read">
          <a href="/reader/en/foo-chapter-8-eng-li/">Ch. 8</a>
        </li>
      </ul>
    `;

    const read = parseMgekoReadChapters(html);
    expect(read.map((c) => c.chapterId)).toEqual([
      "foo-chapter-10-eng-li",
      "foo-chapter-8-eng-li",
    ]);
    expect(read[0].chapterNumber).toBe("10");
  });
});
