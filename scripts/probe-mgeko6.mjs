import { Impit } from "impit";
const client = new Impit({ browser: "chrome" });

// browse-comics uses /api/ - let's find it
const res = await client.fetch("https://www.mgeko.cc/browse-comics/?order=new", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const html = await res.text();

// Find all /api/ occurrences with context
const apiMatches = [...html.matchAll(/\/api\/[^\s"'<>)]+/gi)];
console.log("API endpoints found:");
apiMatches.forEach(m => console.log(m[0]));

// Print script tags
const scriptTags = [...html.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi)];
console.log("\nScript src:", scriptTags.map(m => m[1]));

// Print all inline scripts
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([^<]*fetch[^<]*)<\/script>/gi)];
console.log("\nInline scripts with fetch (first 3):");
inlineScripts.slice(0, 3).forEach(m => console.log(m[1].slice(0, 800)));

// Try the home page trending API
console.log("\n=== HOME trending data ===");
const homeRes = await client.fetch("https://www.mgeko.cc/", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const homeHtml = await homeRes.text();
const homeApiMatches = [...homeHtml.matchAll(/\/api\/[^\s"'<>)]+/gi)];
console.log("Home API endpoints:", homeApiMatches.map(m => m[0]).slice(0,10));

// Try browse with q param
console.log("\n=== BROWSE with q param ===");
const res2 = await client.fetch("https://www.mgeko.cc/browse-comics/?q=solo", {
  headers: { "Referer": "https://www.mgeko.cc/", "X-Requested-With": "XMLHttpRequest" }
});
console.log("Status:", res2.status);
const text2 = await res2.text();
console.log("First 300 chars:", text2.slice(0, 300));

// Try browse API
const res3 = await client.fetch("https://www.mgeko.cc/api/browse/?order=new&page=1", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
console.log("\nBrowse API status:", res3.status);
if (res3.status === 200) {
  const json = await res3.json();
  console.log("Browse API:", JSON.stringify(json).slice(0, 300));
}
