import { Impit } from "impit";
const client = new Impit({ browser: "chrome" });

const res = await client.fetch("https://www.mgeko.cc/manga/m-being-misunderstood-as-a-soccer-genius/", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const html = await res.text();

// Print big sections of the HTML to understand structure
// Find the section from "summary" or "synopsis"
const synopsisIdx = html.toLowerCase().indexOf("synopsis");
if (synopsisIdx > -1) {
  console.log("=== SYNOPSIS AREA ===");
  console.log(html.slice(synopsisIdx - 100, synopsisIdx + 500));
}

// Find author/status/genres area
const statusIdx = html.toLowerCase().indexOf("status");
if (statusIdx > -1) {
  console.log("\n=== STATUS AREA ===");
  console.log(html.slice(statusIdx - 200, statusIdx + 800));
}

// Print all cover img tags with data-src
const coverImgs = [...html.matchAll(/<img[^>]+data-src=["']([^"']+)["'][^>]*>/gi)];
console.log("\n=== COVER data-src ===");
coverImgs.forEach(m => console.log(m[1]));

// Genre links
const genreLinks = [...html.matchAll(/\/genre\/([^"'\/]+)\/?/gi)];
console.log("\n=== GENRE LINKS ===");
genreLinks.forEach(m => console.log(m[1]));

// Print the <h1> to see title
const h1Match = html.match(/<h1[^>]*>([\s\S]{0,200})<\/h1>/i);
console.log("\n=== H1 ===", h1Match?.[1]);

// Print overall page meta like description
const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
console.log("\n=== META DESCRIPTION ===", metaDesc?.[1]?.slice(0, 300));

// Check for trending/popular page
console.log("\n\n=== TRENDING (probe) ===");
const res2 = await client.fetch("https://www.mgeko.cc/", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const html2 = await res2.text();
// find trending section
const trendIdx = html2.toLowerCase().indexOf("trending");
if (trendIdx > -1) console.log(html2.slice(trendIdx, trendIdx + 300));
// Find manga slugs on home
const homeManga = [...html2.matchAll(/href=["']\/manga\/([^"'\/]+)\/?["'][^>]*>/gi)];
console.log("Home manga slugs (first 10):", homeManga.slice(0, 10).map(m => m[1]));
