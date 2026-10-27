"use client";
// Stores the browser's time zone in the `tz` cookie, so the server can work out "this month" (lib/this-month.ts).
// Zone names ("America/New_York") are cookie-safe as they are. Rewritten whenever it changes, e.g. after travelling.
import { useEffect } from "react";

export function TimeZoneCookie() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && !document.cookie.split("; ").includes(`tz=${tz}`))
      document.cookie = `tz=${tz}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, []);
  return null;
}
