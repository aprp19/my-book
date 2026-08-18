import { Impit } from "impit";

const client = new Impit({ browser: "chrome" });

const url =
  "https://www.mgeko.cc/browse-comics/?sort=recently_added&page=1";

const res = await client.fetch(url, {
  headers: { Referer: "https://www.mgeko.cc/" },
});

const html = await res.text();
console.log("status", res.status, "len", html.length);

const slugs = [
  ...html.matchAll(
    /href=["']\/manga\/([^"'\/]+)\/?["']/gi,
  ),
].map((m) => m[1]);
console.log("slugs found", slugs.length, slugs.slice(0, 10));

console.log("has novel-item", html.includes("novel-item"));

const apis = html.match(/\/api\/[^\s"'<>()[\]]+/g) ?? [];
console.log("api hits", Array.from(new Set(apis)).slice(0, 30));

const maybeScriptApi = html.match(/\"\/api\/[^\"]+\"/g) ?? [];
console.log("quoted api hits", maybeScriptApi.slice(0, 20));

console.log("contains recently_added", html.includes("recently_added"));
const recentIdx = html.toLowerCase().indexOf("recently");
if (recentIdx !== -1) {
  console.log("recent snippet:", html.slice(recentIdx - 200, recentIdx + 400));
}

