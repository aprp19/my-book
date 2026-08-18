import { Impit } from "impit";
const client = new Impit({ browser: "chrome" });

const res = await client.fetch(
  "https://www.mgeko.cc/manga/s4ei-shumatsu-sekai-de-chikara-o-eta-ore-wa-genjitsu-de-saikyo-muso/all-chapters/",
  { headers: { "Referer": "https://www.mgeko.cc/" } }
);
const html = await res.text();

// Chapter links
const links = [...html.matchAll(/href=["']\/reader\/en\/([^"'\/]+)\/?["']/gi)];
console.log("Chapter slugs (first 5):", links.slice(0, 5).map(m => m[1]));
console.log("Total chapters found:", links.length);

// Print a section of HTML to understand structure
const listIdx = html.indexOf("chapter-list");
if (listIdx > -1) console.log("Chapter list HTML:", html.slice(listIdx, listIdx + 600));
else {
  // Try another section
  const ulIdx = html.indexOf("<ul");
  if (ulIdx > -1) console.log("First UL:", html.slice(ulIdx, ulIdx + 600));
  // Print all links found
  const anyLinks = [...html.matchAll(/href=["'](\/[^"']+)["']/gi)];
  console.log("All links (first 10):", anyLinks.slice(0, 10).map(m => m[1]));
}

// Also test a manga with many chapters
console.log("\n=== Large manga test ===");
const res2 = await client.fetch(
  "https://www.mgeko.cc/manga/apex-future-martial-arts2/all-chapters/",
  { headers: { "Referer": "https://www.mgeko.cc/" } }
);
const html2 = await res2.text();
const links2 = [...html2.matchAll(/href=["']\/reader\/en\/([^"'\/]+)\/?["']/gi)];
console.log("apex chapters:", links2.length, "first:", links2[0]?.[1], "last:", links2[links2.length-1]?.[1]);
