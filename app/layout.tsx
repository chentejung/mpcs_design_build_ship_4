import type { Metadata } from "next";
import Link from "next/link";
import { Credits } from "@/components/bijou/credits";
import { Brand, HeaderBar, SITE_NAME } from "@/components/system/header";
import { SignOff } from "@/components/system/motifs";
import { SystemTheme } from "@/components/system/theme";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { template: `%s — ${SITE_NAME}`, default: SITE_NAME },
  description: "Pick this month’s films from what’s in cinemas, the all-time greats, or all of TMDB.",
};

// Every page sits in the Pulp shell: the masthead, the page, the credits, THE END and the footer.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <SystemTheme className="min-h-screen">
          <HeaderBar
            brand={
              <Link href="/" className="flex min-h-11 items-center gap-2.5">
                <Brand />
              </Link>
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
        </SystemTheme>
      </body>
    </html>
  );
}
