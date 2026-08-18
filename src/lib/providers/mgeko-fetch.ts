import { unstable_cache } from "next/cache";
import { Impit } from "impit";
import { mapHttpStatusToError } from "./errors";

const BASE_URL = "https://www.mgeko.cc";

let impitClient: Impit | null = null;

function getImpit(): Impit {
  impitClient ??= new Impit({ browser: "chrome" });
  return impitClient;
}

async function mgekoFetchHtml(url: string): Promise<string> {
  const response = await getImpit().fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Referer: BASE_URL + "/",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw mapHttpStatusToError(response.status);
  }

  return response.text();
}

async function mgekoFetchJson<T>(path: string): Promise<T> {
  const response = await getImpit().fetch(`${BASE_URL}${path}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Referer: BASE_URL + "/",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw mapHttpStatusToError(response.status);
  }

  return response.json() as Promise<T>;
}

/** Fetch a full HTML page from mgeko with caching. */
export function mgekoPageFetch(path: string, revalidate: number): Promise<string> {
  return unstable_cache(
    () => mgekoFetchHtml(`${BASE_URL}${path}`),
    ["mgeko", path],
    { revalidate },
  )();
}

/** Fetch a JSON API endpoint from mgeko with caching. */
export function mgekoJsonFetch<T>(path: string, revalidate: number): Promise<T> {
  return unstable_cache(
    () => mgekoFetchJson<T>(path),
    ["mgeko-json", path],
    { revalidate },
  )();
}

export { BASE_URL as MGEKO_BASE_URL };
