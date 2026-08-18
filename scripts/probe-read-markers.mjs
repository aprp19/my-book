import https from "node:https";
import * as cheerio from "cheerio";

const slug =
  process.argv[2] ?? "the-regressed-mercenarys-machinations";
const sessionId = process.env.MGEKO_SESSIONID ?? "";

function fetchHtml(url, cookie) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            Referer: "https://www.mgeko.cc/",
            Cookie: cookie ?? "",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          },
          rejectUnauthorized: false,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => resolve(data));
        },
      )
      .on("error", reject);
  });
}

const url = `https://www.mgeko.cc/manga/${encodeURIComponent(slug)}/all-chapters/`;
const cookie = sessionId ? `sessionid=${sessionId}` : "";
const html = await fetchHtml(url, cookie);
const $ = cheerio.load(html);

console.log("html length", html.length, "auth", Boolean(sessionId));
console.log("visited occurrences", (html.match(/visited/gi) ?? []).length);
console.log("read-chapter occurrences", (html.match(/read-chapter/gi) ?? []).length);

const idx = html.indexOf("chapter-list");
console.log("\nchapter-list snippet:\n", html.slice(idx, idx + 1500));

console.log("\nul.chapter-list li count", $("ul.chapter-list li").length);
$("ul.chapter-list li")
  .slice(0, 8)
  .each((i, el) => {
    const node = $(el);
    console.log("\nli", i, {
      class: node.attr("class"),
      href: node.find("a").first().attr("href"),
      html: $.html(el).slice(0, 350),
    });
  });

const allLi = [];
$("li").each((_, el) => {
  const cls = $(el).attr("class");
  if (cls) allLi.push(cls);
});
console.log("\nunique li classes (sample)", [...new Set(allLi)].slice(0, 20));

// JSON blobs in page
const jsonMatches = [...html.matchAll(/(?:var|let|const)\s+(\w+)\s*=\s*(\{[\s\S]{20,500}?\});/g)];
console.log("\ninline vars", jsonMatches.slice(0, 5).map((m) => m[1]));

const readHistory = html.match(/read[^\"']{0,30}history[^\"']{0,80}/gi);
console.log("\nread history strings", readHistory?.slice(0, 5));
