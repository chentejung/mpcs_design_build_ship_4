import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Sign up" };

// Clerk's catch-all page reads the request, so it renders inside <Suspense> (cacheComponents).
export default function SignUpPage() {
  return (
    <div className="flex justify-center py-12">
      <Suspense>
        <SignUp />
      </Suspense>
    </div>
  );
}
