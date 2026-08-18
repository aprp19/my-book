import { Impit } from "impit";
const client = new Impit({ browser: "chrome" });

// Found /api/most-viewed/?period= - let's test it
const periods = ["1d", "1w", "1m"];
for (const period of periods) {
  const res = await client.fetch(`https://www.mgeko.cc/api/most-viewed/?period=${period}`, {
    headers: { "Referer": "https://www.mgeko.cc/" }
  });
  console.log(`most-viewed period=${period} status=${res.status}`);
  if (res.status === 200) {
    const json = await res.json();
    console.log("Sample:", JSON.stringify(json).slice(0, 400));
  } else {
    const text = await res.text();
    console.log("Response:", text.slice(0, 200));
  }
}

// Try app.min.js to find ajax endpoints
console.log("\n=== Check ajax.js ===");
const res2 = await client.fetch("https://www.mgeko.cc/static/ln/ajax.js", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const ajaxJs = await res2.text();
console.log("ajax.js (first 2000):");
console.log(ajaxJs.slice(0, 2000));

// Also check new_app.js
console.log("\n=== Check new_app.js ===");
const res3 = await client.fetch("https://www.mgeko.cc/static/ln/new_app.js?v=4", {
  headers: { "Referer": "https://www.mgeko.cc/" }
});
const newAppJs = await res3.text();
// find fetch/ajax calls
const fetchMatches = [...newAppJs.matchAll(/fetch\(['"](\/[^'"]+)['"]/g)];
console.log("fetch endpoints in new_app.js:", fetchMatches.map(m => m[1]));
const ajaxMatches = [...newAppJs.matchAll(/url:\s*['"]([^'"]+)['"]/g)];
console.log("ajax url in new_app.js:", ajaxMatches.map(m => m[1]));
console.log("new_app.js (first 1000):");
console.log(newAppJs.slice(0, 1000));
