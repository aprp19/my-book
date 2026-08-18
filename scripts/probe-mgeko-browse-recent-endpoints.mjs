import { Impit } from "impit";

const client = new Impit({ browser: "chrome" });

const url = "https://www.mgeko.cc/browse-comics/?sort=recently_added&page=1";
const browseRes = await client.fetch(url, {
  headers: { Referer: "https://www.mgeko.cc/" },
});
const html = await browseRes.text();

const scriptSrcs = Array.from(
  html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi),
).map((m) => m[1]);

const uniqueScriptSrcs = Array.from(new Set(scriptSrcs));
console.log("script src count:", uniqueScriptSrcs.length);
console.log("script src sample:", uniqueScriptSrcs.slice(0, 10));

const known = [
  "/api/most-viewed",
  "/api/recent",
  "/api/new",
  "/api/latest",
  "/api/popular",
  "recently_added",
  "browse-comics",
];

for (const src of uniqueScriptSrcs) {
  const scriptUrl = src.startsWith("http") ? src : `https://www.mgeko.cc${src}`;
  const jsRes = await client.fetch(scriptUrl, {
    headers: { Referer: "https://www.mgeko.cc/" },
  });
  if (jsRes.status !== 200) continue;
  const js = await jsRes.text();
  const hits = known.filter((k) => js.includes(k));
  if (hits.length) console.log("JS file hits", src, "hits:", hits);

  if (src.includes("new_app.js")) {
    const idx = js.indexOf("/api/");
    console.log("new_app.js first api index", idx);
    if (idx !== -1) console.log("snippet:", js.slice(Math.max(0, idx - 150), idx + 250));
  }
}

