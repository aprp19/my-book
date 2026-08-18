import { Impit } from "impit";
import fs from "node:fs";

const client = new Impit({ browser: "chrome" });
const url = "https://www.mgeko.cc/static/ln/new_app.js?v=4";
const res = await client.fetch(url, {
  headers: {
    Referer: "https://www.mgeko.cc/manga/rankers-return-remake-mg1/all-chapters/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
  },
});
const js = await res.text();
fs.writeFileSync("scripts/new_app.js", js);
console.log("status", res.status, "len", js.length);

for (const kw of [
  "changeViewStatus",
  "changeview",
  "/chapter/",
  "chapterId",
  "all-chapters",
  "getview",
  "viewstatus",
  "viewed",
]) {
  let i = 0;
  let c = 0;
  while ((i = js.indexOf(kw, i)) >= 0) {
    c++;
    if (c <= 3) {
      console.log(`\n--- ${kw} @ ${i} ---`);
      console.log(js.slice(Math.max(0, i - 100), i + 350).replace(/\s+/g, " "));
    }
    i += kw.length;
  }
  if (c) console.log(kw, "count", c);
}
