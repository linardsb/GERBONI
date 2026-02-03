import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Figtree, Geist_Mono, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "@/components/elements/sonner";
import { Header } from "@/components/components/header";
import { Footer } from "@/components/components/footer";
import { ChatWidget } from "@/components/components/chat-widget";
import { NewsletterPopup } from "@/components/compositions/newsletter-popup";
import { ExitIntentOffer } from "@/components/compositions/exit-intent-offer";
import { WishlistProvider } from "@/components/providers/wishlist-provider";
import { routing } from "@/i18n/routing";
import "../globals.css";

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
  src: "../../../public/fonts/Liva.ttf",
  variable: "--font-liva",
  display: "swap",
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    en: "GERBONI - Latvian City Coat of Arms T-Shirts",
    lv: "GERBONI - Latvijas pilsētu ģerboņu krekli",
  };

  const descriptions: Record<string, string> = {
    en: "Premium t-shirts featuring authentic coats of arms from Latvian cities. Wear your heritage with pride.",
    lv: "Augstas kvalitātes krekli ar autentiskiem Latvijas pilsētu ģerboņiem. Velciet savu mantojumu ar lepnumu.",
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as "en" | "lv")) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${figtree.variable} ${geistMono.variable} ${playfairDisplay.variable} ${liva.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <NextIntlClientProvider messages={messages}>
          <WishlistProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ChatWidget />
            <NewsletterPopup />
            <ExitIntentOffer />
            <Toaster />
          </WishlistProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
