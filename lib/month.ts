// "This month" is the user's current month in their own time zone (AGENTS.md → Time zone and "this month"),
// as the date on its first day, the form movie_list_entries.month stores: "2026-10-01".

// An IANA zone name the runtime knows, e.g. "Asia/Tokyo"; anything else (missing, mistyped, forged) is not.
export function isTimeZone(tz: string | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function currentMonth(tz: string | undefined, now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: isTimeZone(tz) ? tz : "UTC",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const part = (type: "year" | "month") => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-01`;
}

// "2026-10-01" → "Oct", for the My List tab.
export const monthShort = (month: string) =>
  new Date(`${month}T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" });

// "2026-10-01" → "October 2026", for page headings.
export const monthLong = (month: string) =>
  new Date(`${month}T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

// "2026-09-01" → "Sep 2026", for Browse's "In your Sep 2026 list".
export const monthShortYear = (month: string) =>
  new Date(`${month}T00:00:00Z`).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
