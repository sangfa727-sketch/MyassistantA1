import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

const BASE_PATH = "/MyassistantA1";

export const metadata: Metadata = {
  title: "My Assistant A1",
  description: "A mobile-first AI assistant for everyday help.",
  applicationName: "My Assistant A1",
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  icons: { icon: `${BASE_PATH}/icon.svg`, apple: `${BASE_PATH}/icon.svg` },
  appleWebApp: { capable: true, title: "My Assistant A1", statusBarStyle: "black-translucent" }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1020"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="my">
      <body>
        {children}
        <Script id="a1-sw" strategy="afterInteractive">{`
          if ("serviceWorker" in navigator) {
            window.addEventListener("load", () => navigator.serviceWorker.register("${BASE_PATH}/sw.js").catch(() => {}));
          }
        `}</Script>
      </body>
    </html>
  );
}