// Clerk on every request; My List and History need a signed-in user, checked here before the page renders
// (AGENTS.md → Routes). Signed-out visitors are redirected to sign in and never reach the page.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isMyList = createRouteMatcher(["/my-list(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isMyList(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
