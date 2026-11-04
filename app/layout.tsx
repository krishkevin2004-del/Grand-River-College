import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ask Grand River",
  description: "Explore housing, dining and events at fictional Grand River University.",
  robots: { index: false }, // pilot: keep it out of search engines
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // use the full phone screen, with safe-area padding in the CSS
  interactiveWidget: "resizes-content", // Android: shrink the page when the keyboard opens
  themeColor: "#ffffff", // matches the white strip at the top
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
