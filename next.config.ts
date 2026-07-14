import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Pin the workspace root to this project so a stray lockfile in an ancestor
  // dir (e.g. /Users/genkovich/sources/package-lock.json) doesn't make Turbopack
  // infer the wrong root and break module resolution (tailwindcss) and env loading.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
