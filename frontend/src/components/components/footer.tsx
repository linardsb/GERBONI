"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { IconBrandInstagram, IconBrandFacebook, IconMail, IconHeart } from "@tabler/icons-react";
import { Separator } from "@/components/elements/separator";
import { Stack } from "@/components/elements/stack";
import { Row } from "@/components/elements/row";
import { Text } from "@/components/elements/text";
import { Section } from "@/components/elements/section";
import { Container } from "@/components/elements/container";

const socialLinks = [
  { href: "https://instagram.com/gerboni.lv", label: "Instagram", icon: IconBrandInstagram },
  { href: "https://facebook.com/gerboni.lv", label: "Facebook", icon: IconBrandFacebook },
  { href: "mailto:hello@gerboni.lv", label: "Email", icon: IconMail },
];

function FooterLinkGroup({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <Text as="h4" variant="heading-xs" className="mb-4">{title}</Text>
      <Stack gap="sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href as "/products" | "/about" | "/contact" | "/faq" | "/shipping" | "/returns" | "/orders" | "/privacy" | "/terms"}
            className="footer-link"
          >
            {link.label}
          </Link>
        ))}
      </Stack>
    </div>
  );
}

export function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    shop: [
      { href: "/products", label: t("allProducts") },
    ],
    company: [
      { href: "/about", label: t("shop") === "Veikals" ? "Mūsu stāsts" : "Our Story" },
      { href: "/contact", label: t("contact") },
      { href: "/faq", label: t("faq") },
    ],
    support: [
      { href: "/shipping", label: t("shipping") },
      { href: "/returns", label: t("returns") },
      { href: "/orders", label: t("shop") === "Veikals" ? "Izsekot pasūtījumu" : "Track Order" },
    ],
    legal: [
      { href: "/privacy", label: t("privacy") },
      { href: "/terms", label: t("terms") },
    ],
  };

  return (
    <footer className="border-t border-border-subtle">
      <Section spacing="compact" background="accent">
        <Container>
          {/* Main Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-section">
            {/* Brand Column - spans 2 on large screens */}
            <div className="col-span-2">
              <Link href="/" className="inline-flex items-center">
                <span className="font-[family-name:var(--font-liva)] text-2xl tracking-wide text-foreground">
                  ĢĒRBOŅI
                </span>
              </Link>
              <Text variant="muted-sm" className="mt-4 max-w-xs">
                {t("tagline")}
              </Text>

              {/* Social Links */}
              <Row gap="group" className="mt-6">
                {socialLinks.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors duration-fast hover:bg-primary hover:text-primary-foreground"
                    aria-label={social.label}
                  >
                    <social.icon className="size-5" aria-hidden="true" />
                  </a>
                ))}
              </Row>
            </div>

            {/* Navigation Columns */}
            <FooterLinkGroup title={t("shop")} links={footerLinks.shop} />
            <FooterLinkGroup title={t("shop") === "Veikals" ? "Uzņēmums" : "Company"} links={footerLinks.company} />
            <FooterLinkGroup title={t("support")} links={footerLinks.support} />
            <FooterLinkGroup title={t("legal")} links={footerLinks.legal} />
          </div>

          <Separator className="my-section" />

          {/* Bottom Bar */}
          <Row wrap="wrap" gap="group" className="text-center md:text-left">
            <Text variant="muted-sm">
              {t("copyright", { year: currentYear })}
            </Text>
            <Text variant="muted-sm" className="hidden md:block">•</Text>
            <Text variant="muted-sm" className="inline-flex items-center gap-1">
              {t("madeIn").split("love").map((part, i) =>
                i === 0 ? (
                  <span key={i}>{part}</span>
                ) : (
                  <span key={i} className="inline-flex items-center gap-1">
                    <IconHeart className="size-4 fill-current text-red-brand" aria-hidden="true" />
                    {part}
                  </span>
                )
              )}
            </Text>
            <Text variant="muted-sm" className="hidden md:block">•</Text>
            <Text variant="muted-sm">
              <a href="mailto:hello@gerboni.lv" className="hover:text-primary transition-colors duration-fast">
                hello@gerboni.lv
              </a>
            </Text>
          </Row>
        </Container>
      </Section>
    </footer>
  );
}
