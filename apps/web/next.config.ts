import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @lottery/shared is a workspace package shipped as TS-compiled CJS; let Next transpile it.
  transpilePackages: ["@lottery/shared"],
  // Pin the monorepo root so Next doesn't guess from multiple lockfiles.
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
