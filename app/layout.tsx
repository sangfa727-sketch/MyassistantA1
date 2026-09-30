import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Assistant A1",
  description: "A mobile-first AI assistant for everyday help.",
  applicationName: "My Assistant A1",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "My Assistant A1", statusBarStyle: "black-translucent" }
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0b1020" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="my"><body>{children}</body></html>;
}