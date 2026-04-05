import type { Metadata } from "next";
// import Script from "next/script";
import "./globals.css";
import Providers from "@/components/Providers";
import ShopAiSupportGate from "@/components/ai-support/ShopAiSupportGate";

export const metadata: Metadata = {
  title: "AF Home - Premium Furniture & Appliances",
  description: "Shop the finest furniture and home appliances. Nationwide shipping available.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiBase = (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? "").replace(/\/+$/, "");
  const fontVars = {
    "--font-poppins": '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
  } as React.CSSProperties;

  return (
    <html lang="en" style={fontVars}>
      <head>
        {/* Preload AI support images so they're ready when the component hydrates */}
        <link rel="preload" as="image" href={`${apiBase}/Image/sir.png`} />
        <link rel="preload" as="image" href={`${apiBase}/Image/af.png`} />
      </head>
      <body className="antialiased bg-white">
        <Providers>{children}</Providers>
        <ShopAiSupportGate />
        {/* <Script
          id="af-ai-support-base"
          strategy="afterInteractive"
        >{`window.appBaseUrl = ${JSON.stringify(apiBase)}; window.afAiApiBase = '';`}</Script>
        <Script src="/ai-support.js" strategy="afterInteractive" /> */}
      </body>
    </html>
  );
}
