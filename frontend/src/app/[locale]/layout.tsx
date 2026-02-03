import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Toaster } from "@/components/elements/sonner";
import { Header } from "@/components/components/header";
import { Footer } from "@/components/components/footer";
import { ChatWidget } from "@/components/components/chat-widget";
import { NewsletterPopup } from "@/components/compositions/newsletter-popup";
import { ExitIntentOffer } from "@/components/compositions/exit-intent-offer";
import { WishlistProvider } from "@/components/providers/wishlist-provider";
import { routing } from "@/i18n/routing";
import { LocaleUpdater } from "@/components/providers/locale-updater";

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
    <NextIntlClientProvider messages={messages}>
      <LocaleUpdater locale={locale} />
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
  );
}
