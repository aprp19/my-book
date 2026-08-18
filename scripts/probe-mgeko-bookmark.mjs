/**
 * Dev probe for mgeko bookmark + read-chapter markers.
 * Usage: MGEKO_SESSIONID=your_sessionid node scripts/probe-mgeko-bookmark.mjs
 */
import { Impit } from "impit";
import * as cheerio from "cheerio";

const sessionId = process.env.MGEKO_SESSIONID ?? "";
const slug =
  process.argv[2] ?? "the-regressed-mercenarys-machinations";

const client = new Impit({ browser: "chrome" });

function authHeaders() {
  return {
    Cookie: `sessionid=${sessionId}`,
    Referer: "https://www.mgeko.cc/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  };
}

async function fetchHtml(url, authenticated = false) {
  const headers = authenticated && sessionId ? authHeaders() : { Referer: "https://www.mgeko.cc/" };
  const res = await client.fetch(url, { headers });
  const html = await res.text();
  return { status: res.status, html };
}

function probeChapterList(html, label) {
  const $ = cheerio.load(html);
  console.log(`\n=== ${label} ===`);
  const items = $("ul.chapter-list li");
  console.log("chapter li count:", items.length);
  items.slice(0, 5).each((_, el) => {
    const $el = $(el);
    console.log({
      class: $el.attr("class"),
      href: $el.find("a").first().attr("href"),
      text: $el.text().trim().slice(0, 80),
      hasVisited: $el.hasClass("visited"),
      hasRead: $el.hasClass("read"),
      hasViewed: $el.hasClass("viewed"),
    });
  });
  const readSelectors = [
    "ul.chapter-list li.visited",
    "ul.chapter-list li.read",
    "ul.chapter-list li.viewed",
    "ul.chapter-list li.read-chapter",
    "ul.chapter-list li.chapter-read",
  ];
  for (const sel of readSelectors) {
    const n = $(sel).length;
    if (n > 0) console.log("read selector hit:", sel, n);
  }
}

function probeBookmarks(html) {
  const $ = cheerio.load(html);
  console.log("\n=== bookmarks ===");
  console.log("title:", $("title").text().trim());
  console.log("is login page:", /welcome back|sign in/i.test($("h1").text()));
  const links = [];
  $('a[href*="/manga/"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const match = href.match(/\/manga\/([^/]+)\/?/);
    if (!match) return;
    links.push({
      slug: match[1],
      title: $(el).text().trim().slice(0, 60),
      href,
    });
  });
  console.log("manga links sample:", links.slice(0, 5));
  console.log("unique slugs:", new Set(links.map((l) => l.slug)).size);
  $("article").each((i, el) => {
    if (i > 2) return;
    const $el = $(el);
    console.log("article", i, {
      class: $el.attr("class"),
      href: $el.find("a").first().attr("href"),
      title: $el.find(".comic-card__title, h2, h3").first().text().trim(),
      img: $el.find("img").first().attr("src")?.slice(0, 80),
    });
  });
}

const publicChapters = await fetchHtml(
  `https://www.mgeko.cc/manga/${encodeURIComponent(slug)}/all-chapters/`,
);
probeChapterList(publicChapters.html, "public all-chapters");

if (sessionId) {
  const bookmarks = await fetchHtml("https://www.mgeko.cc/portal/bookmark/", true);
  console.log("bookmark status:", bookmarks.status);
  probeBookmarks(bookmarks.html);

  const authChapters = await fetchHtml(
    `https://www.mgeko.cc/manga/${encodeURIComponent(slug)}/all-chapters/`,
    true,
  );
  probeChapterList(authChapters.html, "authenticated all-chapters");
} else {
  console.log("\nSet MGEKO_SESSIONID to probe bookmarks and read markers.");
}
