import { describe, expect, test } from "vitest";
import { currentMonth } from "./month";

const at = (iso: string) => new Date(iso);

describe("currentMonth", () => {
  test("is the first of the month the user is in, as a date", () => {
    expect(currentMonth("UTC", at("2026-10-15T12:00:00Z"))).toBe("2026-10-01");
  });

  test("follows the user's own midnight, not UTC's", () => {
    const lateOct31Utc = at("2026-10-31T23:30:00Z");
    expect(currentMonth("Asia/Tokyo", lateOct31Utc)).toBe("2026-11-01"); // 08:30 on Nov 1
    expect(currentMonth("America/New_York", lateOct31Utc)).toBe("2026-10-01"); // 19:30 on Oct 31
  });

  test("turns over exactly at local midnight", () => {
    expect(currentMonth("America/Los_Angeles", at("2026-11-01T06:59:59Z"))).toBe("2026-10-01"); // 23:59:59 PDT
    expect(currentMonth("America/Los_Angeles", at("2026-11-01T07:00:00Z"))).toBe("2026-11-01"); // midnight PDT
  });

  test("works at the far east of the world, UTC+14", () => {
    expect(currentMonth("Pacific/Kiritimati", at("2026-10-31T09:59:00Z"))).toBe("2026-10-01");
    expect(currentMonth("Pacific/Kiritimati", at("2026-10-31T10:00:00Z"))).toBe("2026-11-01");
  });

  test("works at the far west of the world, UTC−12", () => {
    expect(currentMonth("Etc/GMT+12", at("2026-11-01T11:59:00Z"))).toBe("2026-10-01");
    expect(currentMonth("Etc/GMT+12", at("2026-11-01T12:00:00Z"))).toBe("2026-11-01");
  });

  test("rolls the year over at New Year", () => {
    expect(currentMonth("Europe/Berlin", at("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
    expect(currentMonth("UTC", at("2026-12-31T23:30:00Z"))).toBe("2026-12-01");
  });

  test.each([undefined, "", "Mars/Olympus_Mons", "../../etc/passwd", "UTC+5"])("falls back to UTC for the zone %j", (tz) => {
    expect(currentMonth(tz, at("2026-10-31T23:30:00Z"))).toBe("2026-10-01");
    expect(currentMonth(tz, at("2026-11-01T00:30:00Z"))).toBe("2026-11-01");
  });
});
