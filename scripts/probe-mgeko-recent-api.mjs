import { Impit } from "impit";

const client = new Impit({ browser: "chrome" });

const endpoints = [
  "/api/recent/?page=1",
  "/api/new/?page=1",
  "/api/latest/?page=1",
  "/api/popular/?page=1",
  "/api/most-viewed/?period=recent&page=1",
  "/api/most-viewed/?period=latest&page=1",
  "/api/most-viewed/?period=uploaded&page=1",
  "/api/most-viewed/?period=created&page=1",
  "/api/most-viewed/?period=recently_added&page=1",
  "/api/most-viewed/?period=recently-added&page=1",
  "/api/most-viewed/?period=added&page=1",
  "/api/most-viewed/?period=created_at&page=1",
  "/api/most-viewed/?period=day&page=1",
  "/api/most-viewed/?period=week&page=1",
];

for (const path of endpoints) {
  const url = `https://www.mgeko.cc${path}`;
  const res = await client.fetch(url, {
    headers: { Referer: "https://www.mgeko.cc/" },
  });
  console.log(path, "->", res.status);
  if (res.status === 200) {
    const text = await res.text();
    console.log("  sample:", text.slice(0, 120));
  }
}

