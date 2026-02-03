import { Container } from "@/components/elements/container";
import { Section } from "@/components/elements/section";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/card";
import { PageHeader } from "@/components/compositions/page-header";
import { Grid } from "@/components/elements/grid";
import { Badge } from "@/components/elements/badge";
import { IconTruck, IconWorld, IconRocket, IconPackage } from "@tabler/icons-react";

export const metadata = {
  title: "Shipping Information - GERBONI",
  description: "Learn about GERBONI shipping options, delivery times, and international shipping policies.",
};

const shippingOptions = [
  {
    icon: IconTruck,
    title: "Latvia",
    time: "2-4 business days",
    price: "€3.99",
    freeOver: "€50",
    highlight: true,
  },
  {
    icon: IconWorld,
    title: "EU Countries",
    time: "5-10 business days",
    price: "€7.99",
    freeOver: "€75",
  },
  {
    icon: IconRocket,
    title: "Express (Latvia)",
    time: "1-2 business days",
    price: "+€12",
    note: "Add to standard shipping",
  },
];

const internationalShipping = [
  { region: "United Kingdom", time: "7-14 business days", price: "€12.99", note: "Customs fees may apply" },
  { region: "USA / Canada", time: "10-21 business days", price: "€19.99", note: "Import duties are buyer's responsibility" },
  { region: "Other Countries", time: "Contact us", price: "Quote", note: "Email international@gerboni.lv" },
];

export default function ShippingPage() {
  return (
    <>
      <Section spacing="default">
        <Container>
          <PageHeader
            label="Information"
            title="Shipping & Delivery"
            description="All orders ship from Rīga, Latvia with tracking provided via email. We offer flexible shipping options to suit your needs."
            align="center"
          />

          <Grid cols={3} gap="lg">
            {shippingOptions.map((option) => (
              <Card key={option.title} className={option.highlight ? "border-primary" : ""}>
                <CardHeader>
                  <Row gap="group">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <option.icon className="size-5 text-primary" aria-hidden="true" />
                    </div>
                    <Stack gap="none">
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                      <Text variant="muted-sm">{option.time}</Text>
                    </Stack>
                  </Row>
                </CardHeader>
                <CardContent>
                  <Stack gap="sm">
                    <Row justify="between" align="baseline">
                      <Text variant="price-lg">{option.price}</Text>
                      {option.freeOver && (
                        <Badge variant="secondary">Free over {option.freeOver}</Badge>
                      )}
                    </Row>
                    {option.note && (
                      <Text variant="muted-sm">{option.note}</Text>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section spacing="default" background="muted">
        <Container>
          <Stack gap="lg">
            <Text as="h2" variant="heading-lg" align="center">International Shipping</Text>
            <Text variant="muted" align="center" className="max-w-2xl mx-auto">
              We ship worldwide. For destinations outside the EU, please note that customs duties and import taxes may apply upon arrival.
            </Text>

            <Card>
              <CardContent className="p-0">
                <Stack gap="none" className="divide-y">
                  {internationalShipping.map((item) => (
                    <Row key={item.region} justify="between" className="p-group">
                      <Stack gap="none">
                        <Text variant="heading-xs">{item.region}</Text>
                        <Text variant="muted-sm">{item.time}</Text>
                      </Stack>
                      <Stack gap="none" className="text-right">
                        <Text variant="price">{item.price}</Text>
                        <Text variant="muted-sm">{item.note}</Text>
                      </Stack>
                    </Row>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Container>
      </Section>

      <Section spacing="default">
        <Container>
          <Grid cols={2} gap="xl">
            <Stack gap="md">
              <Row gap="group">
                <IconPackage className="size-6 text-primary" aria-hidden="true" />
                <Text as="h2" variant="heading-md">Order Processing</Text>
              </Row>
              <Text variant="body-md">
                Orders placed before 2:00 PM EET on business days are typically processed and shipped within 24 hours. Orders placed after this time or on weekends will be processed on the next business day.
              </Text>
              <Text variant="body-md">
                You&apos;ll receive a shipping confirmation email with your tracking number once your order has been dispatched.
              </Text>
            </Stack>

            <Stack gap="md">
              <Text as="h3" variant="heading-sm">Important Notes</Text>
              <ul className="flex flex-col gap-element">
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">Delivery times are estimates and may vary during peak seasons</Text>
                </li>
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">Tracking information updates may take 24-48 hours after shipment</Text>
                </li>
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">We are not responsible for delays caused by customs or carrier issues</Text>
                </li>
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">Contact us if your order hasn&apos;t arrived within the expected timeframe</Text>
                </li>
              </ul>
            </Stack>
          </Grid>
        </Container>
      </Section>
    </>
  );
}
