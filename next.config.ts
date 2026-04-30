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
    const cspDirectives = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data: https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://upload-widget.cloudinary.com",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' https: ws: wss:",
      "frame-src 'self' https://challenges.cloudflare.com https://www.youtube.com https://player.vimeo.com",
      "worker-src 'self' blob:",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          { key: "Content-Security-Policy", value: cspDirectives.replace(/\s{2,}/g, " ").trim() },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
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
  disable: process.env.DISABLE_SW === "1" || process.env.NODE_ENV !== "production",
})(nextConfig);
