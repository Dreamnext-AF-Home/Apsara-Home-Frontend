import type { Metadata } from "next";
import Script from "next/script";
import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "AF Home — Premium Furniture & Appliances",
  description: "Shop the finest furniture and home appliances. Nationwide shipping available.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const aiBaseUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? "";

  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased bg-white`}>
        <Providers>{children}</Providers>
        <Script
          id="af-ai-support-base"
          strategy="afterInteractive"
        >{`window.appBaseUrl = ${JSON.stringify(aiBaseUrl)}; window.afAiApiBase = '';`}</Script>
        <Script src="/ai-support.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
