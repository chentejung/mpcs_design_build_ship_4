import type { NextConfig } from "next";

// Server-rendered (not a static export): Clerk, Supabase and TMDB all run on the server.
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // AGENTS.md is the owner's; keep `next dev` from writing its own block into it.
  agentRules: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
