import { Impit } from "impit";
import * as cheerio from "cheerio";

const slug =
  process.argv[2] ?? "the-regressed-mercenarys-machinations";
const sessionId = process.env.MGEKO_SESSIONID ?? "";

const client = new Impit({ browser: "chrome" });
const url = `https://www.mgeko.cc/manga/${encodeURIComponent(slug)}/all-chapters/`;

const headers = {
  Referer: "https://www.mgeko.cc/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
};
if (sessionId) headers.Cookie = `sessionid=${sessionId}`;

const res = await client.fetch(url, { headers });
const html = await res.text();
const $ = cheerio.load(html);

console.log("status", res.status, "authenticated", Boolean(sessionId));
console.log("html length", html.length);
console.log("ul.chapter-list li", $("ul.chapter-list li").length);

$("ul.chapter-list li")
  .slice(0, 5)
  .each((i, el) => {
    const node = $(el);
    console.log("\nli", i, {
      class: node.attr("class"),
      href: node.find("a").first().attr("href"),
      text: node.text().trim().slice(0, 100),
      outer: $.html(el).slice(0, 400),
    });
  });

const readSelectors = [
  "ul.chapter-list li.visited",
  "ul.chapter-list li.read",
  "ul.chapter-list li.viewed",
  "li.visited",
  "li.read",
  "[class*='visited']",
  "[class*='read']",
];
for (const sel of readSelectors) {
  const n = $(sel).length;
  if (n) console.log("read selector", sel, n);
}

const readerLinks = [];
$("a[href*='/reader/']").each((i, el) => {
  if (i >= 5) return;
  const node = $(el);
  readerLinks.push({
    href: node.attr("href"),
    text: node.text().trim().slice(0, 80),
    parentTag: node.parent().prop("tagName"),
    parentClass: node.parent().attr("class"),
    liClass: node.closest("li").attr("class"),
  });
});
console.log("\nreader links sample", JSON.stringify(readerLinks, null, 2));

// Dump any li with non-empty class in chapter area
const liClasses = new Set();
$("ul.chapter-list li").each((_, el) => {
  const cls = $(el).attr("class");
  if (cls) liClasses.add(cls);
});
console.log("\nunique li classes", [...liClasses]);
