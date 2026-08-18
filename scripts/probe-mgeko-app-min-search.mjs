import { Impit } from "impit";

const client = new Impit({ browser: "chrome" });
const appUrl =
  "https://www.mgeko.cc/static/ln/app.min.js?v=1acdsd8sdb563asdd64c86232def0e5ed9494e8c48d564e03fcd";

const res = await client.fetch(appUrl, { headers: { Referer: "https://www.mgeko.cc/" } });
const js = await res.text();
console.log("status", res.status, "len", js.length);

const needles = ["browse", "recently", "added", "most", "viewed", "period", "sort", "popular", "api/"];
for (const n of needles) {
  const idx = js.indexOf(n);
  console.log(n, "idx", idx);
}

const occurrences = [];
for (const n of ["browse-comics", "api/", "/api/","most-viewed","recently_added","recently-added","sort=","period="]) {
  let i = 0;
  while (true) {
    const idx = js.indexOf(n, i);
    if (idx === -1) break;
    occurrences.push({ n, idx });
    i = idx + n.length;
    if (occurrences.length > 30) break;
  }
}

console.log("occurrences", occurrences.slice(0, 30));

// Find fetch-like calls
const fetchIdxs = [];
let pos = 0;
while (true) {
  const idx = js.indexOf("fetch", pos);
  if (idx === -1) break;
  fetchIdxs.push(idx);
  pos = idx + 5;
  if (fetchIdxs.length > 10) break;
}
console.log("fetch idxs", fetchIdxs);
for (const idx of fetchIdxs) {
  console.log("\n--- excerpt @", idx, "---");
  console.log(js.slice(Math.max(0, idx - 120), idx + 300));
}

// Also jQuery ajax
const ajaxIdx = js.indexOf("ajax");
console.log("ajax idx", ajaxIdx);
if (ajaxIdx !== -1) {
  console.log("ajax excerpt:", js.slice(Math.max(0, ajaxIdx - 200), ajaxIdx + 500));
}

