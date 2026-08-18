import { Impit } from "impit";
const client = new Impit({ browser: "chrome" });

// Test autocomplete
console.log("=== AUTOCOMPLETE ===");
const res = await client.fetch("https://www.mgeko.cc/autocomplete?term=soccer", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
console.log("Status:", res.status);
const json = await res.json();
console.log("Sample:", JSON.stringify(json).slice(0, 500));

// Try jumbo/manga (referenced in new_app.js)
console.log("\n=== JUMBO MANGA ===");
const res2 = await client.fetch("https://www.mgeko.cc/jumbo/manga/m-being-misunderstood-as-a-soccer-genius/", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
console.log("Status:", res2.status);
const text2 = await res2.text();
console.log("First 500:", text2.slice(0, 500));

// Try recently-added / new releases
const browseEndpoints = [
  "https://www.mgeko.cc/api/recent/?page=1",
  "https://www.mgeko.cc/api/new/?page=1",
  "https://www.mgeko.cc/api/latest/?page=1",
  "https://www.mgeko.cc/api/popular/?page=1",
];
for (const url of browseEndpoints) {
  const r = await client.fetch(url, { headers: { "Referer": "https://www.mgeko.cc/" } });
  console.log(`\n${url} -> status=${r.status}`);
  if (r.status === 200) {
    const j = await r.json();
    console.log("Sample:", JSON.stringify(j).slice(0, 300));
  }
}

// look at app.min.js for endpoints
console.log("\n=== APP.MIN.JS endpoints ===");
const res3 = await client.fetch("https://www.mgeko.cc/static/ln/app.min.js?v=1acdsd8sdb563asdd64c86232def0e5ed9494e8c48d564e03fcd", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const appJs = await res3.text();
const fetchUrls = [...appJs.matchAll(/['"`](\/api\/[^'"`]+)['"`]/g)];
console.log("API paths in app.min.js:", fetchUrls.slice(0, 20).map(m => m[1]));
// also check for endpoint patterns
const endpointPaths = [...appJs.matchAll(/['"`](\/[a-z\-]+\/)[^'"`]*/g)];
console.log("Paths (first 20):", [...new Set(endpointPaths.slice(0, 50).map(m => m[1]))]);
