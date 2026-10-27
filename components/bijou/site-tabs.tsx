"use client";
import { SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { buttonClass } from "@/components/system/controls";
import { useToasts } from "./toasts";

// `count` is this month's Entries as the server last counted them; a change in flight moves it at once.
// During onboarding (AGENTS.md → Product rules 9) the tabs are shown but locked until the preferences are saved; the
// account menu stays, so a new account can still sign out. The server sends every other page back to /onboarding too.
export function SiteTabs({ signedIn, month, count }: { signedIn: boolean; month: string | null; count: number | null }) {
  const path = usePathname();
  const { countMoved } = useToasts();
  const onMyList = path.startsWith("/my-list");
  const locked = path === "/onboarding";
  const tab = (href: string, current: boolean, label: React.ReactNode) =>
    locked ? (
      <span aria-disabled="true" className={buttonClass("secondary")}>{label}</span>
    ) : (
      <Link href={href} aria-current={current ? "page" : undefined} className={buttonClass("secondary")}>{label}</Link>
    );
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <nav aria-label="Site" className="flex flex-wrap gap-2">
        {tab("/", path === "/", "Browse")}
        {signedIn && tab("/my-list", onMyList, <>My List · {month}{count !== null && ` (${count + countMoved})`}</>)}
        {signedIn && tab("/preferences", path === "/preferences", "Preferences")}
      </nav>
      {/* Its slot is kept from the first paint, so the tabs don't jump aside when Clerk's account menu loads. */}
      {signedIn && <span className="inline-flex size-11 items-center justify-center"><UserButton /></span>}
      {!signedIn && (
        <SignInButton mode="modal">
          <button type="button" className={buttonClass("primary")}>Sign in</button>
        </SignInButton>
      )}
    </div>
  );
}

// While the session is read: Browse alone, so a signed-in user never sees Sign in flash. No hooks, so it can sit in
// the static shell of every page.
export function SiteTabsPending() {
  return (
    <nav aria-label="Site" className="flex flex-wrap gap-2">
      <Link href="/" className={buttonClass("secondary")}>Browse</Link>
    </nav>
  );
}

// The masthead's logo: a link home, except during onboarding, where it can't be used to leave. The static shell has
// the link; the path is read inside <Suspense>, as Cache Components require.
const BRAND = "flex min-h-11 items-center gap-2.5";
export function BrandLink({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Link href="/" className={BRAND}>{children}</Link>}>
      <BrandForPath>{children}</BrandForPath>
    </Suspense>
  );
}
function BrandForPath({ children }: { children: React.ReactNode }) {
  return usePathname() === "/onboarding" ? <span className={BRAND}>{children}</span> : <Link href="/" className={BRAND}>{children}</Link>;
}
