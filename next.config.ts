import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const skipBuildChecks = process.env.SKIP_BUILD_CHECKS === "1";
const buildCpusRaw = Number(process.env.NEXT_BUILD_CPUS ?? "");
const buildCpus = Number.isFinite(buildCpusRaw) && buildCpusRaw > 0 ? buildCpusRaw : undefined;
const useWorkerThreads = process.env.NEXT_WORKER_THREADS === "1";

const nextConfig: NextConfig = {
  // Workaround for Windows file locking issues on `.next` (EPERM unlink build-manifest.json).
  // Using a separate build directory avoids touching a locked `.next` folder.
  distDir: process.env.NEXT_DIST_DIR || ".next_build",
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://upload-widget.cloudinary.com https://challenges.cloudflare.com https://www.youtube.com https://player.vimeo.com",
          },
        ],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Controls worker count used during "Collecting page data...". Set `NEXT_BUILD_CPUS=1` to avoid spawn EPERM on Windows.
    cpus: buildCpus,
    // Prefer worker_threads over child_process workers (avoids spawn EPERM on some Windows setups).
    workerThreads: useWorkerThreads,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "1000logos.net",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
      },
      {
        protocol: "https",
        hostname: "download.logo.wine",
      },
    ],
  },
  webpack: (config, { dev }) => {
    // Windows often blocks atomic renames inside webpack's persistent cache packs (EPERM).
    // Disabling the persistent cache for production builds avoids intermittent build failures.
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
};

export default withSerwist({
  swSrc: "sw.ts",
  swDest: "public/sw.js",
  // Disable SW by default to avoid navigation no-response regressions in production.
  // Set ENABLE_SW=1 only when explicitly validating PWA behavior.
  disable: process.env.ENABLE_SW !== "1",
})(nextConfig);


