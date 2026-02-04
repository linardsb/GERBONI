import { Container } from "@/components/elements/container";
import { Section } from "@/components/elements/section";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { Card, CardContent } from "@/components/elements/card";
import { PageHeader } from "@/components/compositions/page-header";
import { Separator } from "@/components/elements/separator";

export const metadata = {
  title: "Privacy Policy - GERBONI",
  description: "Learn how GERBONI collects, uses, and protects your personal information.",
};

const sections = [
  {
    title: "Information We Collect",
    content: [
      "When you make a purchase or create an account, we collect information necessary to process your order and provide customer support:",
      "• Contact information (name, email address, phone number)",
      "• Shipping address and billing address",
      "• Payment information (processed securely through Stripe — we never store card details)",
      "• Order history and preferences",
      "• Communications with our support team",
    ],
  },
  {
    title: "How We Use Your Information",
    content: [
      "We use your information solely to:",
      "• Process and fulfill your orders",
      "• Send order confirmations and shipping updates",
      "• Provide customer support",
      "• Send marketing communications (only with your consent)",
      "• Improve our products and services",
      "• Comply with legal obligations",
    ],
  },
  {
    title: "Data Protection",
    content: [
      "We take the security of your data seriously:",
      "• All payment processing is handled by Stripe with bank-level encryption",
      "• We use HTTPS encryption for all data transmission",
      "• Access to personal data is restricted to authorized personnel only",
      "• We regularly review and update our security practices",
    ],
  },
  {
    title: "Your Rights (GDPR)",
    content: [
      "As a customer in the EU, you have the right to:",
      "• Access your personal data",
      "• Correct inaccurate data",
      "• Request deletion of your data",
      "• Object to processing of your data",
      "• Data portability",
      "• Withdraw consent at any time",
      "",
      "To exercise any of these rights, contact us at support@gerboni.lv",
    ],
  },
  {
    title: "Cookies",
    content: [
      "We use essential cookies to:",
      "• Keep you logged in to your account",
      "• Remember items in your shopping cart",
      "• Process payments securely",
      "",
      "We do not use tracking cookies for advertising. Analytics data is anonymized and used only to improve our website.",
    ],
  },
  {
    title: "Third-Party Services",
    content: [
      "We work with trusted third parties to provide our services:",
      "• Stripe: Payment processing (see stripe.com/privacy)",
      "• Shipping carriers: Order delivery",
      "• Email service providers: Order notifications",
      "",
      "These partners are bound by data protection agreements and only receive data necessary for their specific functions.",
    ],
  },
  {
    title: "Data Retention",
    content: [
      "We retain your data for:",
      "• Order records: 7 years (legal requirement)",
      "• Account information: Until you request deletion",
      "• Marketing preferences: Until you unsubscribe",
      "",
      "You can request account deletion at any time by emailing support@gerboni.lv",
    ],
  },
  {
    title: "Contact Us",
    content: [
      "For privacy-related questions or concerns:",
      "",
      "GERBONI SIA",
      "Email: support@gerboni.lv",
      "Address: Rīga, Latvia",
      "",
      "We respond to all privacy inquiries within 30 days.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <Section spacing="default">
      <Container>
        <PageHeader
          label="Legal"
          title="Privacy Policy"
          description="Your privacy matters to us. This policy explains how we collect, use, and protect your personal information."
          align="center"
        />

        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <Stack gap="lg">
              <div className="flex items-center justify-between text-sm">
                <Text variant="muted">GDPR Compliant</Text>
                <Text variant="muted">Last updated: January 2026</Text>
              </div>

              <Separator />

              <div className="bg-primary/5 p-4 rounded-lg">
                <Text variant="body-md" className="font-medium">
                  Key Points:
                </Text>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    <Text variant="muted-sm">We never sell your data to third parties</Text>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    <Text variant="muted-sm">We never store your payment card details</Text>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    <Text variant="muted-sm">Guest checkout always available — no account required</Text>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    <Text variant="muted-sm">You can delete your account at any time</Text>
                  </li>
                </ul>
              </div>

              {sections.map((section, index) => (
                <div key={section.title}>
                  {index > 0 && <Separator className="mb-6" />}
                  <Stack gap="sm">
                    <Text as="h2" variant="heading-sm">{section.title}</Text>
                    {section.content.map((paragraph, pIndex) => (
                      <Text key={pIndex} variant={paragraph.startsWith("•") ? "muted" : "body-md"}>
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
