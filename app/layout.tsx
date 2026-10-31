import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import AppShell from "./components/AppShell";

// Titles are set in a serif, everything else in a clean sans.
const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-display" });

export const metadata: Metadata = {
  title: "Crowned | Your Personal Stylist",
  description: "Every man is a king. Dress like one.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F3F0" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1115" },
  ],
  colorScheme: "light dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
