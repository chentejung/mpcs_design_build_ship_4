"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parsePreferences, pendingSaveId, withPendingSave, type PreferenceState } from "@/lib/preference-input";
import { requirePreferences } from "@/lib/preferences";
import { supabase } from "@/lib/supabase";

async function save(form: FormData): Promise<PreferenceState> {
  const parsed = parsePreferences(form);
  if (parsed.errors) return { errors: parsed.errors };
  try {
    const { error } = await supabase().from("user_preferences").upsert(parsed.value, { onConflict: "user_id" });
    if (error) return { message: "Your preferences couldn’t be saved. Please try again." };
  } catch {
    return { message: "Your preferences couldn’t be saved. Please try again." };
  }
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function completeOnboarding(_previous: PreferenceState, form: FormData): Promise<PreferenceState> {
  await auth.protect();
  const result = await save(form);
  if (result.saved) redirect(withPendingSave("/", pendingSaveId(form.get("save"))));
  return result;
}

export async function updatePreferences(_previous: PreferenceState, form: FormData): Promise<PreferenceState> {
  await requirePreferences();
  return save(form);
}
