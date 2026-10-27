import "server-only";
import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { pendingSaveId, withPendingSave } from "./preference-input";
import { supabase } from "./supabase";

// Request-scoped only: preferences must never be cached across users. RLS supplies ownership.
export const readPreferences = cache(async () => {
  const { data, error } = await supabase().from("user_preferences").select("display_name, favorite_genre_ids").maybeSingle();
  if (error) throw new Error("We couldn’t load your preferences. Please try again.");
  return data;
});

// `save` is a Film to keep through onboarding (Save after sign-up), already checked by pendingSaveId.
export async function requirePreferences(save: string | null = null) {
  await auth.protect();
  const preferences = await readPreferences();
  if (!preferences) redirect(withPendingSave("/onboarding", save));
  return preferences;
}

export async function browsePreferences(save?: unknown) {
  const { userId } = await auth();
  return userId ? requirePreferences(pendingSaveId(save)) : null;
}
