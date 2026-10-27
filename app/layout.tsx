import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Credits } from "@/components/bijou/credits";
import { SiteNav } from "@/components/bijou/site-nav";
import { SiteTabsPending } from "@/components/bijou/site-tabs";
import { TimeZoneCookie } from "@/components/bijou/time-zone-cookie";
import { ToastProvider } from "@/components/bijou/toasts";
import { Brand, HeaderBar, SITE_NAME } from "@/components/system/header";
import { SignOff } from "@/components/system/motifs";
import { SystemTheme } from "@/components/system/theme";
import { fontVariables } from "./fonts";
import "./globals.css";
import "./bijou.css";

export const metadata: Metadata = {
  title: { template: `%s — ${SITE_NAME}`, default: SITE_NAME },
  description: "Pick this month’s films from what’s in cinemas, the all-time greats, or all of TMDB.",
};

// Every page sits in the Pulp shell: the masthead with its tab bar, the page, the credits, THE END and the footer,
// with the shared Undo/error toast over them.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <ClerkProvider signUpForceRedirectUrl="/onboarding">
          <TimeZoneCookie />
          <SystemTheme className="min-h-screen">
            <ToastProvider>
              <HeaderBar
                brand={
                  <Link href="/" className="flex min-h-11 items-center gap-2.5">
                    <Brand />
                  </Link>
                }
                action={
                  <Suspense fallback={<SiteTabsPending />}>
                    <SiteNav />
                  </Suspense>
                }
              />
              <main className="mx-auto max-w-7xl px-[5vw]">
                {children}
                <Credits />
              </main>
              <SignOff />
              <footer className="ds-footer ds-fine ds-muted mx-auto max-w-7xl px-[5vw] py-8">
                {SITE_NAME} · Design Build Ship, Week 4
              </footer>
            </ToastProvider>
          </SystemTheme>
        </ClerkProvider>
      </body>
    </html>
  );
}
