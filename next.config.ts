import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:4000/api/v1/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/workspaces",
        destination: "/",
        permanent: false,
      },
      {
        source: "/workspaces/new",
        destination: "/",
        permanent: false,
      },
    ];
  },

  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
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
