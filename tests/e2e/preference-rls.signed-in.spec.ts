import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import type { Database } from "../../lib/database.types";
import { signIn, skipWithoutTestUsers, userDatabase, USER_A, USER_B } from "./signed-in";

// Attack the Data API with real Clerk tokens, without the app's form validation. No privileged key is used.
test("preferences RLS blocks cross-account reads, forged writes, deletion and invalid answers", async ({ page, browser }) => {
  skipWithoutTestUsers();
  await signIn(page, USER_A!);
  const contextB = await browser.newContext();
  try {
    const pageB = await contextB.newPage();
    await signIn(pageB, USER_B!);
    const a = await userDatabase(page);
    const b = await userDatabase(pageB);
    const aId = await page.evaluate(() => window.Clerk.user!.id);
    const bId = await pageB.evaluate(() => window.Clerk.user!.id);
    const ownA = await a.from("user_preferences").select("*");
    const ownB = await b.from("user_preferences").select("*");
    expect(ownA.error).toBeNull();
    expect(ownB.error).toBeNull();
    expect(ownA.data).toHaveLength(1);
    expect(ownB.data).toHaveLength(1);
    expect(ownA.data![0].user_id).toBe(aId);
    expect(ownB.data![0].user_id).toBe(bId);

    for (const [attacker, victimId] of [[a, bId], [b, aId]] as const) {
      const read = await attacker.from("user_preferences").select("*").eq("user_id", victimId);
      expect(read.error).toBeNull();
      expect(read.data).toEqual([]);
      const update = await attacker.from("user_preferences").update({ display_name: "Hijacked" }).eq("user_id", victimId).select();
      expect(update.error).toBeNull();
      expect(update.data).toEqual([]);
      const forged = await attacker.from("user_preferences").upsert({ user_id: victimId, display_name: "Hijacked", favorite_genre_ids: [28] });
      expect(forged.error?.code).toBe("42501");
    }
    expect((await a.from("user_preferences").update({ user_id: bId }).eq("user_id", aId)).error?.code).toBe("P0001");
    expect((await a.from("user_preferences").update({ created_at: "2000-01-01T00:00:00Z" }).eq("user_id", aId)).error?.code).toBe("P0001");
    expect((await a.from("user_preferences").delete().eq("user_id", aId)).error?.code).toBe("42501");
    for (const invalid of [{ display_name: " " }, { favorite_genre_ids: [] }, { favorite_genre_ids: [999999] }]) {
      expect((await a.from("user_preferences").update(invalid).eq("user_id", aId)).error?.code).toBe("23514");
    }
    const anon = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!);
    expect((await anon.from("user_preferences").select()).error?.code).toBe("42501");
    expect((await a.from("user_preferences").select("*")).data).toEqual(ownA.data);
    expect((await b.from("user_preferences").select("*")).data).toEqual(ownB.data);
  } finally { await contextB.close(); }
});
