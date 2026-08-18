import { Impit } from "impit";
const client = new Impit({ browser: "chrome" });

// Probe search page
console.log("=== SEARCH PAGE ===");
const res = await client.fetch("https://www.mgeko.cc/search/?search=soccer", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const html = await res.text();
// Find manga cards
const mangaLinks = [...html.matchAll(/href=["']\/manga\/([^"'\/]+)\/?["'][^>]*>/gi)];
console.log("Manga slugs (first 10):");
mangaLinks.slice(0, 10).forEach(m => console.log(m[1]));

// Find cover images in search results
const coverImgs = [...html.matchAll(/<img[^>]+src=["'](https:\/\/[^"']+)["'][^>]*>/gi)];
console.log("\nCover images (first 5):");
coverImgs.slice(0, 5).forEach(m => console.log(m[1]));

// Find manga titles near the links
const titleMatches = [...html.matchAll(/class=["'][^"']*title[^"']*["'][^>]*>([^<]+)</gi)];
console.log("\nTitle elements (first 10):");
titleMatches.slice(0, 10).forEach(m => console.log(m[1].trim()));

// Print a chunk of the search results HTML
const resultsSection = html.match(/class=["'][^"']*manga[^"']*["'][^>]*>[\s\S]{0,2000}/i);
if (resultsSection) console.log("\nSample results HTML:", resultsSection[0].slice(0, 1000));

// Probe browse/latest-updates  
console.log("\n\n=== BROWSE PAGE (latest) ===");
const res2 = await client.fetch("https://www.mgeko.cc/manga-updates/", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const html2 = await res2.text();
const mangaLinks2 = [...html2.matchAll(/href=["']\/manga\/([^"'\/]+)\/?["'][^>]*>/gi)];
console.log("Manga slugs (first 5):", mangaLinks2.slice(0, 5).map(m => m[1]));

// Check manga page for description, genres, cover
console.log("\n\n=== MANGA DETAIL PAGE ===");
const res3 = await client.fetch("https://www.mgeko.cc/manga/m-being-misunderstood-as-a-soccer-genius/", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const html3 = await res3.text();
// Cover
const coverMatch = html3.match(/class=["'][^"']*cover[^"']*["'][^>]*>[\s\S]{0,500}/i);
console.log("Cover section:", coverMatch?.[0].slice(0, 300));

// Status
const statusMatch = html3.match(/status[^<]*<[^>]+>([^<]+)</i);
console.log("Status raw:", statusMatch?.[0].slice(0, 100));

// Description
const descMatch = html3.match(/class=["'][^"']*summary[^"']*["'][^>]*>([\s\S]{0,500})/i);
console.log("Description section:", descMatch?.[0].slice(0, 300));

// Genres
const genreMatches = [...html3.matchAll(/class=["'][^"']*tag[^"']*["'][^>]*>([^<]+)</gi)];
console.log("Genre tags:", genreMatches.slice(0, 10).map(m => m[1].trim()));
