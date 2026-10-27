// The one door to Supabase, server-only (AGENTS.md → Data access). Every call carries the signed-in user's Clerk
// session token, so row-level security decides what they can read and write; signed out there is no token and
// Supabase treats the call as `anon`, which has no grants. There is no service-role key and no way around RLS.
import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function supabase() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    accessToken: async () => (await auth()).getToken(),
  });
}
