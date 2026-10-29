import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "./components/BottomNav";
import TopAvatar from "./components/TopAvatar";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Crowned | Your Personal Stylist",
  description: "Every man is a king. Dress like one.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable}`}>
        <div className="relative mx-auto min-h-screen max-w-md pb-24">
          <TopAvatar />
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}