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
