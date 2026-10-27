// The tab bar in the masthead: Browse always, My List · <this month> only when signed in, then Clerk's Sign in or
// account menu. Reads the session, so the layout renders it inside <Suspense>.
import { auth } from "@clerk/nextjs/server";
import { monthShort } from "@/lib/month";
import { thisMonth } from "@/lib/this-month";
import { SiteTabs } from "./site-tabs";

export async function SiteNav() {
  const { userId } = await auth();
  return <SiteTabs signedIn={userId !== null} month={userId ? monthShort(await thisMonth()) : null} />;
}
