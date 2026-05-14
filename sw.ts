import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  // Navigation preload can race with runtime caching and produce intermittent
  // no-response errors on storefront navigations.
  navigationPreload: false,
  runtimeCaching: [
    // Never cache API calls to avoid stale/rate-limited partner storefront payloads.
    {
      matcher: ({ url, request }) => request.method === "GET" && url.origin === self.location.origin && url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    // Keep partner storefront navigations network-first so route HTML and JS stay in sync.
    {
      matcher: ({ request, url }) =>
        request.mode === "navigate" &&
        url.origin === self.location.origin &&
        /^\/shop\/[^/]+\/(product|category)(\/.*)?$/i.test(url.pathname),
      handler: new NetworkFirst({
        cacheName: "partner-navigation",
        networkTimeoutSeconds: 8,
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
