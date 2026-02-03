import { Container } from "@/components/elements/container";
import { Section } from "@/components/elements/section";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { Card, CardContent } from "@/components/elements/card";
import { PageHeader } from "@/components/compositions/page-header";
import { Separator } from "@/components/elements/separator";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service - GERBONI",
  description: "Terms and conditions for using the GERBONI online store.",
};

const sections = [
  {
    title: "1. General",
    content: [
      "These Terms of Service govern your use of the GERBONI website (gerboni.lv) and any purchases made through it. By using our website or placing an order, you agree to these terms.",
      "GERBONI SIA reserves the right to modify these terms at any time. Changes will be posted on this page with an updated revision date.",
    ],
  },
  {
    title: "2. Products & Pricing",
    content: [
      "All products are subject to availability. We reserve the right to limit quantities or refuse orders at our discretion.",
      "Prices are displayed in Euros (€) and include VAT where applicable. Prices may change without notice, but orders already placed will be honored at the price shown at checkout.",
      "Product images are for illustration purposes. While we strive for accuracy, colors may appear differently on your screen.",
    ],
  },
  {
    title: "3. Orders & Payment",
    content: [
      "An order is confirmed when you receive an order confirmation email. Until then, we reserve the right to decline any order.",
      "Payment is required at the time of purchase. We accept Visa, Mastercard, American Express, Apple Pay, Google Pay, and Klarna (EU only).",
      "All payments are processed securely through Stripe. We never have access to your full card details.",
    ],
  },
  {
    title: "4. Order Modifications & Cancellations",
    content: [
      "Order cancellation is possible within 1 hour of placing the order. Contact support immediately.",
      "Address changes can be made before the order shows \"Shipped\" status.",
      "After shipping, orders cannot be modified. You may return the item after delivery for a refund.",
    ],
  },
  {
    title: "5. Shipping",
    content: [
      "Shipping costs and estimated delivery times are displayed at checkout. Times are estimates and not guaranteed.",
      "Risk of loss passes to you upon delivery to the shipping carrier.",
      "For international orders, you are responsible for any customs duties, taxes, or import fees.",
      "See our Shipping Policy for complete details.",
    ],
  },
  {
    title: "6. Returns & Refunds",
    content: [
      "We offer a 14-day return window from the date of delivery.",
      "Items must be unworn, unwashed, and have original tags attached.",
      "Refunds are processed to the original payment method within 5-10 business days after we receive the return.",
      "Original shipping costs are non-refundable unless the return is due to our error.",
      "See our Returns & Refunds Policy for complete details.",
    ],
  },
  {
    title: "7. Intellectual Property",
    content: [
      "All content on this website, including but not limited to text, images, logos, and designs, is the property of GERBONI SIA and is protected by copyright law.",
      "The coat of arms designs are used in accordance with Latvian heraldic regulations and may not be reproduced without permission.",
    ],
  },
  {
    title: "8. Limitation of Liability",
    content: [
      "GERBONI SIA is not liable for any indirect, incidental, or consequential damages arising from the use of our products or website.",
      "Our liability is limited to the purchase price of the product(s) in question.",
      "We are not responsible for delays or failures due to circumstances beyond our control (force majeure).",
    ],
  },
  {
    title: "9. User Accounts",
    content: [
      "You are responsible for maintaining the confidentiality of your account credentials.",
      "You agree to notify us immediately of any unauthorized use of your account.",
      "We reserve the right to suspend or terminate accounts that violate these terms.",
      "Guest checkout is always available if you prefer not to create an account.",
    ],
  },
  {
    title: "10. Governing Law",
    content: [
      "These terms are governed by the laws of the Republic of Latvia.",
      "Any disputes shall be resolved in the courts of Rīga, Latvia.",
      "For EU consumers, this does not affect your statutory rights under applicable consumer protection laws.",
    ],
  },
  {
    title: "11. Contact",
    content: [
      "For questions about these terms, contact us:",
      "",
      "GERBONI SIA",
      "Email: support@gerboni.lv",
      "Address: Rīga, Latvia",
    ],
  },
];

export default function TermsPage() {
  return (
    <Section spacing="default">
      <Container>
        <PageHeader
          label="Legal"
          title="Terms of Service"
          description="Please read these terms carefully before using our website or making a purchase."
          align="center"
        />

        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <Stack gap="lg">
              <div className="flex items-center justify-between text-sm">
                <Text variant="muted">Effective: January 1, 2026</Text>
                <Text variant="muted">Last updated: January 2026</Text>
              </div>

              <Separator />

              <div className="bg-muted/50 p-4 rounded-lg">
                <Text variant="body-md">
                  By placing an order on gerboni.lv, you agree to these Terms of Service and our{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  ,{" "}
                  <Link href="/shipping" className="text-primary hover:underline">
                    Shipping Policy
                  </Link>
                  , and{" "}
                  <Link href="/returns" className="text-primary hover:underline">
                    Returns Policy
                  </Link>
                  .
                </Text>
              </div>

              {sections.map((section, index) => (
                <div key={section.title}>
                  {index > 0 && <Separator className="mb-6" />}
                  <Stack gap="sm">
                    <Text as="h2" variant="heading-sm">{section.title}</Text>
                    {section.content.map((paragraph, pIndex) => (
                      <Text key={pIndex} variant={paragraph === "" ? "body-md" : "body-md"}>
                        {paragraph}
                      </Text>
                    ))}
                  </Stack>
                </div>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}
