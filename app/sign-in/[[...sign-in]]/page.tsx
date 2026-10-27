import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Sign in" };

// Clerk's catch-all page reads the request, so it renders inside <Suspense> (cacheComponents).
export default function SignInPage() {
  return (
    <div className="flex justify-center py-12">
      <Suspense>
        <SignIn />
      </Suspense>
    </div>
  );
}
