const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/** Parse provider datetime strings (ISO or mgeko human-readable). */
export function parseProviderDate(raw: string | null | undefined): Date | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct;

  // Mgeko: "Aug. 18, 2026, 3:22 a.m."
  const mgekoMatch = trimmed.match(
    /^([A-Za-z]+)\.?\s+(\d{1,2}),\s+(\d{4}),\s+(\d{1,2}):(\d{2})\s*(a\.m\.|p\.m\.|AM|PM)/i,
  );
  if (!mgekoMatch) return null;

  const [, monthStr, day, year, hour, minute, ampm] = mgekoMatch;
  const monthKey = monthStr.toLowerCase().replace(/\./g, "").slice(0, 3);
  const month = MONTH_INDEX[monthKey];
  if (month === undefined) return null;

  let h = Number.parseInt(hour, 10);
  const isPm = ampm.toLowerCase().includes("p");
  if (isPm && h < 12) h += 12;
  if (!isPm && h === 12) h = 0;

  return new Date(
    Number.parseInt(year, 10),
    month,
    Number.parseInt(day, 10),
    h,
    Number.parseInt(minute, 10),
  );
}

export function toIsoDateString(raw: string | null | undefined): string | null {
  const date = parseProviderDate(raw);
  return date ? date.toISOString() : null;
}

export function formatChapterReleaseDate(
  publishedAt: string | null | undefined,
): string | null {
  const date = parseProviderDate(publishedAt);
  if (!date) return null;
  return formatDistanceToNow(date.toISOString());
}

export function formatDistanceToNow(iso: string): string {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 30) return rtf.format(-days, "day");

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  }).format(date);
}
