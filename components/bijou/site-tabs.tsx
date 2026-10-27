"use client";
import { SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClass } from "@/components/system/controls";
import { useToasts } from "./toasts";

// `count` is this month's Entries as the server last counted them; a change in flight moves it at once.
export function SiteTabs({ signedIn, month, count }: { signedIn: boolean; month: string | null; count: number | null }) {
  const path = usePathname();
  const { countMoved } = useToasts();
  const onMyList = path.startsWith("/my-list");
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <nav aria-label="Site" className="flex flex-wrap gap-2">
        <Link href="/" aria-current={path === "/" ? "page" : undefined} className={buttonClass("secondary")}>Browse</Link>
        {signedIn && (
          <Link href="/my-list" aria-current={onMyList ? "page" : undefined} className={buttonClass("secondary")}>
            My List · {month}{count !== null && ` (${count + countMoved})`}
          </Link>
        )}
      </nav>
      {signedIn && <UserButton />}
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
