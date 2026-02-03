import type { Metadata } from "next";
import { Figtree, Geist_Mono, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const liva = localFont({
  src: "../../public/fonts/Liva.ttf",
  variable: "--font-liva",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GERBONI - Latvian City Coat of Arms T-Shirts",
  description:
    "Premium t-shirts featuring authentic coats of arms from Latvian cities. Wear your heritage with pride.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${figtree.variable} ${geistMono.variable} ${playfairDisplay.variable} ${liva.variable} font-sans antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
