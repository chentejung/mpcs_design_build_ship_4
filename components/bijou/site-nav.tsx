// The tab bar in the masthead: Browse always, My List · <this month> (<its count>) only when signed in, then Clerk's Sign in or
// account menu. Reads the session, so the layout renders it inside <Suspense>.
import { auth } from "@clerk/nextjs/server";
import { countEntries } from "@/lib/entries";
import { monthShort } from "@/lib/month";
import { thisMonth } from "@/lib/this-month";
import { SiteTabs } from "./site-tabs";

export async function SiteNav() {
  const { userId } = await auth();
  if (!userId) return <SiteTabs signedIn={false} month={null} count={null} />;
  const month = await thisMonth();
  // If Supabase can't answer, the tab still leads to My List, just without its count.
  const count = await countEntries(month).catch((error) => {
    console.error(error);
    return null;
  });
  return <SiteTabs signedIn month={monthShort(month)} count={count} />;
}
