import { describe, expect, it } from "vitest";
import { signRemoved, verifyRemoved, type RemovedEntry } from "./undo-token";

const entry: RemovedEntry = {
  id: "0b6f4c1e-7d1a-4f43-9b0e-6d2a9c1f5e01",
  month: "2026-10-01",
  tmdb_id: 1400940,
  title: "Clayface",
  original_title: "Clayface",
  original_language: "en",
  release_year: 2026,
  runtime: 104,
  poster_path: "/clayface.jpg",
  genre_ids: [27, 53, 878],
  overview: "Matt Hagen's meteoric rise…",
  added_at: "2026-10-27T05:00:00.123456+00:00",
  watched_at: null,
};

const SECRET = "a-test-secret-that-is-at-least-32-bytes-long";
const NOW = Date.parse("2026-10-27T06:00:00Z");
const signed = signRemoved(entry, { userId: "user_a", secret: SECRET, now: NOW });

// Rewrites the signed copy's payload, keeping the signature.
function tamper(token: string, change: (payload: { entry: RemovedEntry; exp: number }) => void) {
  const [payload, signature] = token.split(".");
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  change(data);
  return `${Buffer.from(JSON.stringify(data)).toString("base64url")}.${signature}`;
}

describe("the signed copy of a removed Entry", () => {
  it("round-trips: the same user, in time, with the same secret, gets the exact row back", () => {
    expect(verifyRemoved(signed, { userId: "user_a", secret: SECRET, now: NOW + 3000 })).toEqual(entry);
  });

  it("refuses a tampered row", () => {
    const forged = tamper(signed, (p) => { p.entry.title = "Something else"; });
    expect(verifyRemoved(forged, { userId: "user_a", secret: SECRET, now: NOW })).toBeNull();
  });

  it("refuses a pushed-back expiry", () => {
    const forged = tamper(signed, (p) => { p.exp += 60_000; });
    expect(verifyRemoved(forged, { userId: "user_a", secret: SECRET, now: NOW + 20_000 })).toBeNull();
  });

  it("refuses another user", () => {
    expect(verifyRemoved(signed, { userId: "user_b", secret: SECRET, now: NOW })).toBeNull();
  });

  it("refuses it once expired, about 10 seconds on", () => {
    expect(verifyRemoved(signed, { userId: "user_a", secret: SECRET, now: NOW + 9000 })).toEqual(entry);
    expect(verifyRemoved(signed, { userId: "user_a", secret: SECRET, now: NOW + 10_001 })).toBeNull();
  });

  it("refuses a copy signed with another secret", () => {
    const other = signRemoved(entry, { userId: "user_a", secret: "another-secret-also-at-least-32-bytes!!", now: NOW });
    expect(verifyRemoved(other, { userId: "user_a", secret: SECRET, now: NOW })).toBeNull();
  });

  it("refuses garbage", () => {
    for (const token of ["", "abc", "abc.def", `${signed}x`, "....", 42 as unknown as string])
      expect(verifyRemoved(token, { userId: "user_a", secret: SECRET, now: NOW })).toBeNull();
  });
});
