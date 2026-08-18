export type ApiErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_RATE_LIMITED"
  | "MANGA_NOT_FOUND"
  | "CHAPTER_NOT_FOUND"
  | "PAGES_NOT_FOUND"
  | "INVALID_PROVIDER"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR";

export class ProviderError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status = 500) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.status = status;
  }
}

export function mapHttpStatusToError(status: number): ProviderError {
  if (status === 429) {
    return new ProviderError(
      "PROVIDER_RATE_LIMITED",
      "Manga provider is temporarily unavailable.",
      429,
    );
  }
  if (status === 404) {
    return new ProviderError("MANGA_NOT_FOUND", "Manga not found.", 404);
  }
  return new ProviderError(
    "PROVIDER_UNAVAILABLE",
    "Manga provider is temporarily unavailable.",
    502,
  );
}
