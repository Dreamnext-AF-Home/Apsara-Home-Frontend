declare module "next-pwa" {
  import type { NextConfig } from "next";

  type RuntimeCaching = Record<string, unknown>;

  interface PWAConfig {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    runtimeCaching?: RuntimeCaching[];
    buildExcludes?: Array<string | RegExp>;
    fallbacks?: Record<string, string>;
    [key: string]: unknown;
  }

  export default function withPWA(
    config: PWAConfig
  ): (nextConfig?: NextConfig) => NextConfig;
}
