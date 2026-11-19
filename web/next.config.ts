import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't ship source maps to browsers: only minified output reaches the client, never readable source.
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
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
