import type { Metadata } from "next";
import { Figtree, Geist_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/elements/sonner";
import { Header } from "@/components/components/header";
import { Footer } from "@/components/components/footer";
import { ChatWidget } from "@/components/components/chat-widget";
import { NewsletterPopup } from "@/components/compositions/newsletter-popup";
import { ExitIntentOffer } from "@/components/compositions/exit-intent-offer";
import { WishlistProvider } from "@/components/providers/wishlist-provider";
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

export const metadata: Metadata = {
  title: "GERBONI - Latvian City Coat of Arms T-Shirts",
  description: "Premium t-shirts featuring authentic coats of arms from Latvian cities. Wear your heritage with pride.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} ${geistMono.variable} ${playfairDisplay.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <WishlistProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatWidget />
          <NewsletterPopup />
          <ExitIntentOffer />
          <Toaster />
        </WishlistProvider>
      </body>
    </html>
  );
}
