import { Impit } from "impit";
const client = new Impit({ browser: "chrome" });

// Autocomplete returns HTML list
console.log("=== AUTOCOMPLETE HTML ===");
const res = await client.fetch("https://www.mgeko.cc/autocomplete?term=soccer", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const html = await res.text();
console.log("First 1000:", html.slice(0, 1000));

// Extract manga slugs from autocomplete 
const links = [...html.matchAll(/href=["']\/manga\/([^"'\/]+)\/?["']/gi)];
console.log("Manga slugs:", links.map(m => m[1]));
// Extract titles
const titles = [...html.matchAll(/class=["'][^"']*title[^"']*["'][^>]*>([^<]+)/gi)];
console.log("Titles:", titles.map(m => m[1].trim()));
// Extract covers
const covers = [...html.matchAll(/src=["'](https:\/\/imgsrv[^"']+)["']/gi)];
console.log("Covers:", covers.map(m => m[1]));

// Check chapter list for manga - look at what HTML structure the chapter list uses
console.log("\n=== MANGA PAGE CHAPTER LIST ===");
const res2 = await client.fetch("https://www.mgeko.cc/manga/m-being-misunderstood-as-a-soccer-genius/", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const html2 = await res2.text();
// Find the chapter list section
const chapListIdx = html2.indexOf("chapter-list");
if (chapListIdx > -1) {
  console.log("Chapter list section:", html2.slice(chapListIdx, chapListIdx + 1500));
}

// Find a li item with chapter info
const chapterItems = [...html2.matchAll(/<li[^>]*class=["'][^"']*chapter[^"']*["'][^>]*>([\s\S]{0,200})<\/li>/gi)];
if (chapterItems.length === 0) {
  // Try to find chapter links differently
  const chLinks = [...html2.matchAll(/href=["'](\/reader\/en\/[^"']+)["'][^>]*>\s*([\s\S]{0,100})/gi)];
  console.log("Chapter links with context (first 3):");
  chLinks.slice(0, 3).forEach(m => console.log(m[0].slice(0, 200)));
}

// Look for the ul containing chapters
const ulIdx = html2.indexOf("chapters-list");
if (ulIdx > -1) {
  console.log("chapters-list section:", html2.slice(ulIdx, ulIdx + 800));
}

// Look for number/date patterns near chapter links
const chLink = html2.match(/href="\/reader\/en\/[^"]+">[\s\S]{0,300}/);
if (chLink) console.log("First chapter link context:", chLink[0]);
