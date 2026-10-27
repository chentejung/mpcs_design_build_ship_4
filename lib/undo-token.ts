// Undo of Remove (AGENTS.md → Product rules 6): the server deletes the Entry and hands the browser a copy of the row,
// signed with HMAC-SHA256 under the server-only UNDO_SIGNING_SECRET. The signature also covers the signed-in user's
// Clerk id (never in the token, never sent by the client) and an expiry about 10 s ahead, so the browser can keep the
// copy for the 3-second Undo but can't forge an Entry, stretch the window or hand the copy to another user.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Database } from "./database.types";

export type RemovedEntry = Omit<Database["public"]["Tables"]["movie_list_entries"]["Row"], "user_id">;

type Key = { userId: string; secret: string; now: number };

const TTL_MS = 10_000;

const sign = (payload: string, { userId, secret }: Omit<Key, "now">) =>
  createHmac("sha256", secret).update(`${userId}\n${payload}`).digest();

export function signRemoved(entry: RemovedEntry, key: Key): string {
  const payload = Buffer.from(JSON.stringify({ entry, exp: key.now + TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload, key).toString("base64url")}`;
}

// The exact row back, or null if the copy is forged, altered, expired, another user's or signed under another secret.
export function verifyRemoved(token: unknown, key: Key): RemovedEntry | null {
  if (typeof token !== "string") return null;
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length) return null;
  const given = Buffer.from(signature, "base64url");
  const expected = sign(payload, key);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const { entry, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof exp === "number" && key.now <= exp ? (entry as RemovedEntry) : null;
  } catch {
    return null;
  }
}

// The secret from the environment. Missing or short is a setup mistake, so it fails loudly rather than signing weakly.
export function undoSecret(): string {
  const secret = process.env.UNDO_SIGNING_SECRET;
  if (!secret || secret.length < 32) throw new Error("Set UNDO_SIGNING_SECRET (32+ random bytes) to sign Undo of Remove");
  return secret;
}
