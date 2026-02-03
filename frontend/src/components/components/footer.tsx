import Link from "next/link";
import { IconBrandInstagram, IconBrandFacebook, IconMail } from "@tabler/icons-react";
import { Separator } from "@/components/elements/separator";
import { Grid } from "@/components/elements/grid";
import { Stack } from "@/components/elements/stack";
import { Row } from "@/components/elements/row";
import { Text } from "@/components/elements/text";
import { Section } from "@/components/elements/section";
import { Container } from "@/components/elements/container";

const footerLinks = {
  shop: [
    { href: "/products", label: "All Products" },
    { href: "/products?city=riga", label: "Rīga Collection" },
    { href: "/products?city=liepaja", label: "Liepāja Collection" },
    { href: "/products?city=daugavpils", label: "Daugavpils Collection" },
  ],
  company: [
    { href: "/about", label: "Our Story" },
    { href: "/contact", label: "Contact Us" },
    { href: "/faq", label: "FAQ" },
  ],
  support: [
    { href: "/shipping", label: "Shipping & Delivery" },
    { href: "/returns", label: "Returns & Refunds" },
    { href: "/orders", label: "Track Order" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

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
            href={link.href}
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
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle">
      <Section spacing="compact" background="accent">
        <Container>
          {/* Main Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-section">
            {/* Brand Column - spans 2 on large screens */}
            <div className="col-span-2">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex size-8 items-center justify-center border border-foreground text-foreground font-serif text-sm">
                  G
                </div>
                <Text variant="label">GERBONI</Text>
              </Link>
              <Text variant="muted-sm" className="mt-4 max-w-xs">
                Premium t-shirts featuring authentic Latvian city coats of arms. Wear your heritage with pride.
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
            <FooterLinkGroup title="Shop" links={footerLinks.shop} />
            <FooterLinkGroup title="Company" links={footerLinks.company} />
            <FooterLinkGroup title="Support" links={footerLinks.support} />
            <FooterLinkGroup title="Legal" links={footerLinks.legal} />
          </div>

          <Separator className="my-section" />

          {/* Bottom Bar */}
          <Row justify="between" wrap="wrap" gap="group" className="text-center md:text-left">
            <Text variant="muted-sm">
              © {currentYear} GERBONI. All rights reserved.
            </Text>
            <Row gap="group" className="flex-wrap justify-center md:justify-end">
              <Text variant="muted-sm">Made with ❤️ in Rīga, Latvia 🇱🇻</Text>
              <Text variant="muted-sm" className="hidden md:block">•</Text>
              <Text variant="muted-sm">
                <a href="mailto:hello@gerboni.lv" className="hover:text-primary transition-colors duration-fast">
                  hello@gerboni.lv
                </a>
              </Text>
            </Row>
          </Row>
        </Container>
      </Section>
    </footer>
  );
}
