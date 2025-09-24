import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip ESLint during production builds (handled separately in CI/local)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip TypeScript type checking during production builds
  // (type checks should run in CI/local to catch issues without blocking deploys)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
