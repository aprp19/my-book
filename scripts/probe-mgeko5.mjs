import { Impit } from "impit";
const client = new Impit({ browser: "chrome" });

// browse-comics returns 0 manga - might be AJAX loaded. Check the HTML for scripts
const res = await client.fetch("https://www.mgeko.cc/browse-comics/?order=new", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const html = await res.text();
// Check for api endpoints or data attributes
const apiMatch = html.match(/\/api\/|fetch\(|ajax\(|XMLHttp/gi);
console.log("API patterns:", apiMatch?.slice(0, 10));

// Look for data attributes or JSON config
const dataConfig = html.match(/window\.__[A-Z_]+\s*=\s*(\{[^;]+\})/i);
console.log("Window config:", dataConfig?.[1]?.slice(0, 500));

// Print a section of the page that might show how items load
const bodyMatch = html.match(/<main[^>]*>([\s\S]{0,2000})/i);
console.log("Main section:", bodyMatch?.[1]?.slice(0, 1000));

// Check if there's an endpoint for trending
console.log("\n=== CHECK TRENDING AJAX ===");
const trendRes = await client.fetch("https://www.mgeko.cc/api/trending/", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
console.log("Trending API status:", trendRes.status);

// Check home page for recent section links
console.log("\n=== HOME PAGE recent/popular links ===");
const homeRes = await client.fetch("https://www.mgeko.cc/", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const homeHtml = await homeRes.text();
// Print trending section HTML
const trendIdx = homeHtml.indexOf("mgx-list");
if (trendIdx > -1) {
  console.log(homeHtml.slice(trendIdx, trendIdx + 1500));
}
