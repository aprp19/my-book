import { Impit } from "impit";
const client = new Impit({ browser: "chrome" });

// Probe reader page for image extraction pattern
const res = await client.fetch("https://www.mgeko.cc/reader/en/m-being-misunderstood-as-a-soccer-genius-chapter-6-eng-li/", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const html = await res.text();

// Find img tags
const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
console.log("=== IMG TAGS (first 10) ===");
imgMatches.slice(0, 10).forEach(m => console.log(m[0].slice(0, 200)));

// Find data-src
const dataSrcMatches = [...html.matchAll(/data-src=["']([^"']+)["']/gi)];
console.log("\n=== DATA-SRC (first 10) ===");
dataSrcMatches.slice(0, 10).forEach(m => console.log(m[1]));

// Find ts_reader
const tsReader = html.match(/ts_reader\.run\((.+?)\);/s);
console.log("\n=== ts_reader ===");
if (tsReader) console.log(tsReader[1].slice(0, 500));
else console.log("NOT FOUND");

// Find any JSON arrays of image urls
const jsonArrayMatch = html.match(/\["https?:\/\/[^\]]+\.(jpg|png|webp)[^\]]*\]/i);
console.log("\n=== JSON ARRAY with image URLs ===");
if (jsonArrayMatch) console.log(jsonArrayMatch[0].slice(0, 500));
else console.log("NOT FOUND");

// Find script tags content containing image-related data
const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
console.log("\n=== SCRIPTS containing 'image' or 'pages' (first 5) ===");
scriptMatches.filter(m => /image|pages|chapter_img/i.test(m[1])).slice(0, 5).forEach(m => {
  console.log("---");
  console.log(m[1].slice(0, 800));
});

console.log("\n=== HTML length ===", html.length);

// Also check manga page for chapter list structure
console.log("\n\n=== MANGA PAGE PROBE ===");
const res2 = await client.fetch("https://www.mgeko.cc/manga/m-being-misunderstood-as-a-soccer-genius/", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const html2 = await res2.text();
// Find chapter list items
const chapterLinks = [...html2.matchAll(/href=["']\/reader\/en\/([^"']+)["']/gi)];
console.log("Chapter links (first 5):");
chapterLinks.slice(0, 5).forEach(m => console.log(m[1]));

// Find search form or ajax endpoint hints
const ajaxMatch = html2.match(/ajax\/chapters/i);
console.log("Ajax chapters endpoint found:", !!ajaxMatch);

// Find title
const titleMatch = html2.match(/<h1[^>]*>([^<]+)<\/h1>/i);
console.log("Title:", titleMatch?.[1]);
