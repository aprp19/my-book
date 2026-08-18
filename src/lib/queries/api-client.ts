import type { ApiErrorCode } from "@/lib/providers/errors";
import { ProviderError } from "@/lib/providers/errors";

interface ApiErrorBody {
  error?: {
    code?: ApiErrorCode;
    message?: string;
  };
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path);

  let json: { data?: T } & ApiErrorBody;
  try {
    json = (await response.json()) as { data?: T } & ApiErrorBody;
  } catch {
    throw new ProviderError(
      "PROVIDER_UNAVAILABLE",
      "Manga provider is temporarily unavailable.",
      502,
    );
  }

  if (!response.ok || json.error) {
    const code = json.error?.code ?? "INTERNAL_ERROR";
    const message = json.error?.message ?? "Something went wrong.";
    throw new ProviderError(code, message, response.status || 500);
  }

  if (json.data === undefined) {
    throw new ProviderError("INTERNAL_ERROR", "Invalid API response.", 500);
  }

  return json.data;
}
