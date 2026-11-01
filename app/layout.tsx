import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import AppShell from "./components/AppShell";
import { themeInitScript } from "@/lib/theme";

// SF Pro on Apple devices, Geist everywhere else.
const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Crowned | Your Personal Stylist",
  description: "Every man is a king. Dress like one.",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  colorScheme: "light dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
