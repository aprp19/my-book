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

export interface MgekoAuthFetchOptions {
  referer?: string;
  csrfToken?: string;
}

export interface MgekoUserCheckResponse {
  logged_in: boolean;
  user?: string;
}

let impitClient: Impit | null = null;

function getImpit(): Impit {
  impitClient ??= new Impit({ browser: "chrome" });
  return impitClient;
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function buildCookieHeader(sessionId: string, csrfToken?: string): string {
  const parts = [`sessionid=${sessionId}`];
  if (csrfToken?.trim()) {
    parts.push(`csrftoken=${csrfToken.trim()}`);
  }
  return parts.join("; ");
}

function authHeaders(sessionId: string, options: MgekoAuthFetchOptions = {}) {
  return {
    Cookie: buildCookieHeader(sessionId, options.csrfToken),
    Referer: options.referer ?? `${MGEKO_BASE_URL}/`,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "User-Agent": USER_AGENT,
  };
}

function jsonHeaders(sessionId: string, options: MgekoAuthFetchOptions = {}) {
  return {
    ...authHeaders(sessionId, options),
    Accept: "application/json, text/plain, */*",
  };
}

export async function mgekoAuthFetchJson<T>(
  path: string,
  sessionId: string,
  options: MgekoAuthFetchOptions = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${MGEKO_BASE_URL}${path}`;
  const response = await getImpit().fetch(url, {
    headers: jsonHeaders(sessionId, options),
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

  return response.json() as Promise<T>;
}

export async function mgekoAuthFetchHtml(
  path: string,
  sessionId: string,
  options: MgekoAuthFetchOptions = {},
): Promise<string> {
  const url = path.startsWith("http") ? path : `${MGEKO_BASE_URL}${path}`;
  const response = await getImpit().fetch(url, {
    headers: authHeaders(sessionId, options),
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

  const html = await response.text();
  if (!html.trim()) {
    throw new MgekoAuthError(
      "FETCH_FAILED",
      `Empty response from ${path}. Check your network or try again.`,
    );
  }

  return html;
}

/** Confirms the sessionid is logged in via mgeko's /usercheck/ endpoint (new_app.js). */
export async function validateMgekoSession(
  sessionId: string,
  options: MgekoAuthFetchOptions = {},
): Promise<{ username: string }> {
  const data = await mgekoAuthFetchJson<MgekoUserCheckResponse>(
    "/usercheck/",
    sessionId,
    options,
  );

  if (!data.logged_in) {
    throw new MgekoAuthError(
      "INVALID_SESSION",
      "Mgeko session is not logged in. Log in on mgeko, open an all-chapters page and confirm you see eye icons, then paste a fresh sessionid.",
    );
  }

  return { username: data.user?.trim() || "user" };
}
