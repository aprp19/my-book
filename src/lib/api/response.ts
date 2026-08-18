import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiErrorCode } from "@/lib/providers/errors";
import { ProviderError } from "@/lib/providers/errors";
import { isMangaProviderType } from "@/lib/providers/registry";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ProviderError) {
    return apiError(error.code, error.message, error.status);
  }

  console.error(error);
  return apiError("INTERNAL_ERROR", "Something went wrong.", 500);
}

const providerSchema = z.string().refine(isMangaProviderType, {
  message: "Invalid provider",
});

export function parseProviderParam(provider: string) {
  const result = providerSchema.safeParse(provider);
  if (!result.success) {
    throw new ProviderError("INVALID_PROVIDER", "Invalid manga provider.", 400);
  }
  return result.data;
}

export function parseSearchQuery(raw: string | null) {
  const schema = z
    .string()
    .trim()
    .min(2, "Search query must be at least 2 characters.")
    .max(100, "Search query is too long.");

  const result = schema.safeParse(raw ?? "");
  if (!result.success) {
    throw new ProviderError(
      "VALIDATION_ERROR",
      result.error.issues[0]?.message ?? "Invalid search query.",
      400,
    );
  }
  return result.data;
}

export function parseIdParam(id: string, label = "ID") {
  const schema = z.string().trim().min(1).max(200);
  const result = schema.safeParse(id);
  if (!result.success) {
    throw new ProviderError("VALIDATION_ERROR", `Invalid ${label}.`, 400);
  }
  return result.data;
}
