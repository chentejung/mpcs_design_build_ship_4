import { describe, expect, it } from "vitest";
import { checkRequiredEnv } from "./required-env";

const all = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
  CLERK_SECRET_KEY: "sk_test_x",
  SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
  TMDB_READ_ACCESS_TOKEN: "eyJ",
  UNDO_SIGNING_SECRET: "secret",
};

describe("the build-time env check", () => {
  it("does nothing off Vercel, even with every variable missing", () => {
    expect(() => checkRequiredEnv({})).not.toThrow();
  });

  it("passes on Vercel when every required variable is set", () => {
    expect(() => checkRequiredEnv({ ...all, VERCEL: "1" })).not.toThrow();
  });

  it("fails a Vercel build naming every missing variable", () => {
    const env = { VERCEL: "1", VERCEL_ENV: "preview", CLERK_SECRET_KEY: "sk_test_x", SUPABASE_URL: "https://x.supabase.co", TMDB_READ_ACCESS_TOKEN: "eyJ" };
    expect(() => checkRequiredEnv(env)).toThrow(
      "Missing environment variables for this Vercel build (preview): NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, SUPABASE_PUBLISHABLE_KEY, UNDO_SIGNING_SECRET. Set them in Vercel → Project → Settings → Environment Variables.",
    );
  });

  it("counts a variable set to an empty or blank value as missing", () => {
    expect(() => checkRequiredEnv({ ...all, VERCEL: "1", UNDO_SIGNING_SECRET: "  " })).toThrow(/: UNDO_SIGNING_SECRET\./);
  });
});
