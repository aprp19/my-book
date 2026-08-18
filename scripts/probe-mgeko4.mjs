import { Impit } from "impit";
const client = new Impit({ browser: "chrome" });

// Probe browse pages
const browseUrls = [
  "https://www.mgeko.cc/browse-comics/?order=new",
  "https://www.mgeko.cc/browse-comics/?order=update",
  "https://www.mgeko.cc/browse-comics/?order=views",
  "https://www.mgeko.cc/browse-comics/",
  "https://www.mgeko.cc/latest-updates/",
  "https://www.mgeko.cc/hot/",
];

for (const url of browseUrls) {
  const res = await client.fetch(url, { headers: { "Referer": "https://www.mgeko.cc/" } });
  const html = await res.text();
  const mangaLinks = [...html.matchAll(/href=["']\/manga\/([^"'\/]+)\/?["'][^>]*>/gi)];
  console.log(`${url} -> status=${res.status}, manga count=${mangaLinks.length}, first 3: ${mangaLinks.slice(0,3).map(m=>m[1]).join(", ")}`);
}

// Also check search with page param
console.log("\n=== SEARCH PAGINATION ===");
const res = await client.fetch("https://www.mgeko.cc/search/?search=solo&page=2", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const html = await res.text();
const mangaLinks = [...html.matchAll(/href=["']\/manga\/([^"'\/]+)\/?["'][^>]*>/gi)];
console.log("Search p2 manga count:", mangaLinks.length, "first 3:", mangaLinks.slice(0,3).map(m=>m[1]).join(", "));

// Probe reader page for full img list count
console.log("\n=== READER PAGE IMG COUNT ===");
const res2 = await client.fetch("https://www.mgeko.cc/reader/en/m-being-misunderstood-as-a-soccer-genius-chapter-6-eng-li/", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const html2 = await res2.text();
const imgs = [...html2.matchAll(/src=["'](https:\/\/imgsrv[^"']+)["']/gi)];
console.log("Total chapter images:", imgs.length);
imgs.slice(0, 3).forEach(m => console.log(m[1]));
