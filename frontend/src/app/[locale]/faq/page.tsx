import { Container } from "@/components/elements/container";
import { Section } from "@/components/elements/section";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { Button } from "@/components/elements/button";
import { Card, CardContent } from "@/components/elements/card";
import { PageHeader } from "@/components/compositions/page-header";
import { FAQAccordion } from "@/components/compositions/faq-accordion";
import { Grid } from "@/components/elements/grid";
import Link from "next/link";
import { IconPackage, IconTruck, IconRefresh, IconCreditCard, IconShirt, IconHelp } from "@tabler/icons-react";

export const metadata = {
  title: "FAQ - GERBONI",
  description: "Frequently asked questions about GERBONI products, shipping, returns, and more.",
};

const faqCategories = [
  {
    category: "Orders & Shipping",
    icon: <IconTruck className="h-5 w-5 text-primary" />,
    items: [
      {
        question: "How long does shipping take?",
        answer: "Latvia: 2-4 business days (€3.99, free over €50). EU countries: 5-10 business days (€7.99, free over €75). Express shipping available for Latvia only at +€12 (1-2 days).",
      },
      {
        question: "Do you ship internationally?",
        answer: "Yes! We ship to the UK (7-14 days, €12.99), USA/Canada (10-21 days, €19.99), and other countries on request. Contact international@gerboni.lv for quotes. Note: customs fees and import duties may apply.",
      },
      {
        question: "How can I track my order?",
        answer: "Once your order ships, you'll receive an email with a tracking number. You can also view your order status in your account under 'Orders'. All orders ship from Rīga with tracking.",
      },
      {
        question: "Can I change my shipping address after ordering?",
        answer: "Yes, as long as the order hasn't shipped yet. Contact support immediately at support@gerboni.lv or use our live chat. After shipping, address changes are not possible.",
      },
      {
        question: "Can I cancel my order?",
        answer: "Orders can be cancelled within 1 hour of placing them. After that, we may have already started processing. Contact support immediately if you need to cancel.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    icon: <IconRefresh className="h-5 w-5 text-primary" />,
    items: [
      {
        question: "What is your return policy?",
        answer: "We offer a 14-day return window from delivery date. Items must be unworn with original tags attached. Return shipping is free within Latvia; EU customers pay return postage.",
      },
      {
        question: "How do I return an item?",
        answer: "Contact support@gerboni.lv or use our live chat within 14 days of delivery. We'll provide return instructions and a shipping label (free for Latvia).",
      },
      {
        question: "How long do refunds take?",
        answer: "Refunds are processed within 5-10 business days of receiving the returned item. The refund goes to your original payment method. Bank processing may add 3-5 additional days.",
      },
      {
        question: "What if I received a damaged or wrong item?",
        answer: "Report within 48 hours with photos. We'll send a replacement immediately or provide a full refund—your choice. No need to return the damaged item.",
      },
      {
        question: "Can I exchange for a different size or color?",
        answer: "Yes, subject to stock availability. Contact us before returning to confirm the exchange item is in stock. Price differences will be charged or refunded.",
      },
    ],
  },
  {
    category: "Products & Sizing",
    icon: <IconShirt className="h-5 w-5 text-primary" />,
    items: [
      {
        question: "What sizes are available?",
        answer: "We offer XS through XXL. Check our size guide on each product page for detailed measurements. Our shirts are pre-shrunk, so what you see is what you get.",
      },
      {
        question: "What material are the t-shirts made of?",
        answer: "100% organic cotton, 180 GSM medium weight. Soft, breathable, and durable for everyday wear.",
      },
      {
        question: "How should I wash my t-shirt?",
        answer: "Machine wash cold (30°C max), do not bleach, tumble dry low or hang dry. Iron on reverse side only to protect the print. Do not dry clean.",
      },
      {
        question: "Are the coat of arms designs authentic?",
        answer: "Yes! Each design faithfully represents the official coat of arms of its respective Latvian city. Our designs are created in accordance with Latvian heraldic regulations.",
      },
      {
        question: "What printing method do you use?",
        answer: "Direct-to-garment (DTG) printing with eco-friendly, wash-resistant inks. The print becomes part of the fabric for long-lasting quality.",
      },
    ],
  },
  {
    category: "Payment & Security",
    icon: <IconCreditCard className="h-5 w-5 text-primary" />,
    items: [
      {
        question: "What payment methods do you accept?",
        answer: "Visa, Mastercard, American Express, Apple Pay, Google Pay, and Klarna (buy now, pay later—EU only). All payments are secured via Stripe.",
      },
      {
        question: "Is my payment information secure?",
        answer: "Absolutely. We never store your card details. All payment processing is handled by Stripe with bank-level encryption and security.",
      },
      {
        question: "Do you offer buy now, pay later?",
        answer: "Yes, Klarna is available for EU customers. Select Klarna at checkout to split your payment or pay within 30 days.",
      },
      {
        question: "Can I use multiple discount codes?",
        answer: "Only one discount code can be applied per order. Choose the one that gives you the best value!",
      },
    ],
  },
  {
    category: "Account & Support",
    icon: <IconHelp className="h-5 w-5 text-primary" />,
    items: [
      {
        question: "Do I need an account to order?",
        answer: "No! Guest checkout is always available. However, creating an account lets you track orders, save addresses, and view order history.",
      },
      {
        question: "How do I reset my password?",
        answer: "Click 'Forgot Password' on the login page and enter your email. You'll receive a reset link within a few minutes.",
      },
      {
        question: "How can I delete my account?",
        answer: "Email support@gerboni.lv with your deletion request. We'll process it within 30 days in compliance with GDPR.",
      },
      {
        question: "What are your support hours?",
        answer: "Live chat: 9:00-18:00 EET weekdays. Email: 24-hour response time. Phone: 10:00-17:00 EET weekdays. Chat gets the fastest response!",
      },
    ],
  },
  {
    category: "Bulk & Custom Orders",
    icon: <IconPackage className="h-5 w-5 text-primary" />,
    items: [
      {
        question: "Do you offer bulk discounts?",
        answer: "Yes! 10+ items: 10% discount (auto-applied). 25+ items: 15% discount—contact sales@gerboni.lv for a custom quote.",
      },
      {
        question: "Can I order custom municipality designs?",
        answer: "Yes! Minimum 50 units with a 4-6 week lead time. Email custom@gerboni.lv with your requirements for a quote.",
      },
      {
        question: "Do you offer gift wrapping?",
        answer: "Yes! Gift wrapping is available for €2.50 per item. You can also add a free personalized message (up to 150 characters) at checkout.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <>
      <Section spacing="default">
        <Container>
          <PageHeader
            label="Help Center"
            title="Frequently Asked Questions"
            description="Find answers to common questions about our products, shipping, returns, and more."
            align="center"
          />

          <Grid cols={2} gap="xl">
            <div className="lg:col-span-2">
              <FAQAccordion categories={faqCategories} />
            </div>
          </Grid>
        </Container>
      </Section>

      <Section spacing="compact" background="muted">
        <Container>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <Stack gap="group" align="center">
                <Text as="h2" variant="heading-md">Still have questions?</Text>
                <Text variant="muted" align="center">
                  Can&apos;t find what you&apos;re looking for? Our support team is ready to help.
                </Text>
                <Row gap="group" wrap="wrap" justify="center">
                  <Button asChild>
                    <Link href="/contact">Contact Support</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="mailto:support@gerboni.lv">Email Us</a>
                  </Button>
                </Row>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </>
  );
}
