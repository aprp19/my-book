import { Impit } from "impit";
import { MGEKO_BASE_URL } from "./mgeko-fetch";

export type MgekoAuthErrorCode = "INVALID_SESSION" | "RATE_LIMITED" | "FETCH_FAILED";

export class MgekoAuthError extends Error {
  readonly code: MgekoAuthErrorCode;

  constructor(code: MgekoAuthErrorCode, message: string) {
    super(message);
    this.name = "MgekoAuthError";
    this.code = code;
  }
}

let impitClient: Impit | null = null;

function getImpit(): Impit {
  impitClient ??= new Impit({ browser: "chrome" });
  return impitClient;
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

export async function mgekoAuthFetchHtml(
  path: string,
  sessionId: string,
): Promise<string> {
  const url = path.startsWith("http") ? path : `${MGEKO_BASE_URL}${path}`;
  const response = await getImpit().fetch(url, {
    headers: {
      Cookie: `sessionid=${sessionId}`,
      Referer: `${MGEKO_BASE_URL}/`,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent": USER_AGENT,
    },
  });

  if (response.status === 429) {
    throw new MgekoAuthError(
      "RATE_LIMITED",
      "Mgeko is rate limiting requests. Try again in a few minutes.",
    );
  }

  if (!response.ok) {
    throw new MgekoAuthError(
      "FETCH_FAILED",
      `Could not fetch ${path} (HTTP ${response.status}).`,
    );
  }

  return response.text();
}
