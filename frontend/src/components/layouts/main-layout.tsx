"use client";

import { Header } from "@/components/components/header";
import { Footer } from "@/components/components/footer";
import { ChatWidget } from "@/components/components/chat-widget";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </>
  );
}
