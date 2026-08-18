import { Impit } from "impit";

const client = new Impit({ browser: "chrome" });
const base = "https://www.mgeko.cc/browse-comics/?";

const paramSets = [
  "sort=recently_added&page=1",
  "sort=recently_added&page=1&minchaps=0",
  "sort=recently_added&page=1&minchaps=0&rating=0",
  "sort=recently_added&page=1&minchaps=0&status=Any",
  "sort=recently_added&page=1&minchaps=0&status=ongoing",
  "sort=recently_added&page=1&minchaps=0&type=manhwa",
  "sort=recently_added&page=1&minchaps=0&genre_included=Comedy&minchaps=0",
];

for (const params of paramSets) {
  const url = `${base}${params}`;
  const res = await client.fetch(url, {
    headers: { Referer: "https://www.mgeko.cc/" },
  });
  const html = await res.text();
  const slugs = [
    ...html.matchAll(/href=["']\/manga\/([^"'\/]+)\/?["']/gi),
  ].map((m) => m[1]);
  console.log(params, "status", res.status, "slugs", slugs.length);
}

