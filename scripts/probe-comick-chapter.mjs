import { Impit } from "impit";

const client = new Impit({ browser: "chrome" });

async function getJson(url) {
  const res = await client.fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text();
  try {
    return { status: res.status, json: JSON.parse(text) };
  } catch {
    return { status: res.status, json: text.slice(0, 200) };
  }
}

function summarizeChapter(data) {
  const ch = data.chapter ?? data;
  return {
    hid: ch.hid,
    chap: ch.chap,
    lang: ch.lang,
    md_images: ch.md_images?.length ?? 0,
    images: ch.images?.length ?? 0,
    keys: Object.keys(ch).slice(0, 40),
    md_images_sample: ch.md_images?.[0],
    images_sample: ch.images?.[0],
    server: ch.server,
    url: ch.url,
  };
}

const comic = await getJson(
  "https://api.comick.dev/comic/i-m-being-misunderstood-as-a-soccer-genius",
);
console.log("comic", {
  status: comic.status,
  hid: comic.json.comic?.hid ?? comic.json.hid,
  slug: comic.json.comic?.slug ?? comic.json.slug,
});

const comicHid = comic.json.comic?.hid ?? comic.json.hid;
const chapters = await getJson(
  `https://api.comick.dev/comic/${comicHid}/chapters?page=1&limit=5&lang=en`,
);
console.log(
  "chapters",
  (chapters.json.chapters ?? []).map((c) => ({
    hid: c.hid,
    chap: c.chap,
    lang: c.lang,
    group: c.group_name,
  })),
);

// Find whether the problematic chapter is present in this language list.
const targetHid = "Y7kLjPo8";
const findInPage1 = (chapters.json.chapters ?? []).find(
  (c) => String(c.hid) === targetHid,
);
console.log("target in page1?", Boolean(findInPage1), findInPage1 ?? null);

// Search across a few pages for the target hid and print its raw fields.
for (let p = 1; p <= 10; p++) {
  const resp = await getJson(
    `https://api.comick.dev/comic/${comicHid}/chapters?page=${p}&limit=50&lang=en`,
  );
  const found = (resp.json.chapters ?? []).find(
    (c) => String(c.hid) === targetHid,
  );
  if (found) {
    console.log("found at page", p, {
      hid: found.hid,
      chap: found.chap,
      lang: found.lang,
      group_name: found.group_name,
      md_images: found.md_images,
      images: found.images,
      md_images_count: found.md_images?.length,
      images_count: found.images?.length,
      keys: Object.keys(found).slice(0, 30),
    });
    break;
  }
}

for (const path of [
  `/chapter/${targetHid}`,
  `/chapter/${targetHid}?tachiyomi=true`,
  `/chapter/${targetHid}?lang=en`,
  `/chapter/${targetHid}?tachiyomi=true&lang=en`,
  `/chapter/${targetHid}?tachiyomi=true&lang=id`,
  `/chapter/${targetHid}?lang=id`,
  `/chapter/${targetHid}/get_images`,
  `/chapter/${targetHid}/get_images?lang=en`,
  `/chapter/${targetHid}/get_images?lang=id`,
]) {
  const result = await getJson(`https://api.comick.dev${path}`);
  console.log(path, result.status, summarizeChapter(result.json));
  if (path.includes("get_images")) {
    console.log(
      "get_images raw",
      Array.isArray(result.json) ? result.json.slice(0, 2) : result.json,
    );
  }
}
