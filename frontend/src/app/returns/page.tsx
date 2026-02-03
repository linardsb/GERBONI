import { Container } from "@/components/elements/container";
import { Section } from "@/components/elements/section";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/card";
import { PageHeader } from "@/components/compositions/page-header";
import { Grid } from "@/components/elements/grid";
import { Badge } from "@/components/elements/badge";
import { IconRefresh, IconPackageOff, IconAlertTriangle, IconCheck } from "@tabler/icons-react";

export const metadata = {
  title: "Returns & Refunds - GERBONI",
  description: "Learn about GERBONI return policy, refund process, and exchange options.",
};

const returnSteps = [
  {
    step: 1,
    title: "Contact Support",
    description: "Email support@gerboni.lv or use our live chat within 14 days of delivery",
  },
  {
    step: 2,
    title: "Get Return Label",
    description: "We'll send you a return label (free within Latvia, paid for EU)",
  },
  {
    step: 3,
    title: "Ship Your Item",
    description: "Pack the item securely with original tags attached",
  },
  {
    step: 4,
    title: "Receive Refund",
    description: "Refund processed within 5-10 business days of receiving the item",
  },
];

export default function ReturnsPage() {
  return (
    <>
      <Section spacing="default">
        <Container>
          <PageHeader
            label="Policy"
            title="Returns & Refunds"
            description="We want you to love your GERBONI purchase. If you're not completely satisfied, we're here to help."
            align="center"
          />

          <Grid cols={2} gap="xl">
            <Card>
              <CardHeader>
                <Row gap="group">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconRefresh className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle>Return Policy</CardTitle>
                </Row>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  <Row gap="group">
                    <Badge variant="secondary">14 Days</Badge>
                    <Text variant="muted">Return window from delivery date</Text>
                  </Row>
                  <ul className="flex flex-col gap-group">
                    <li className="flex items-start gap-element">
                      <IconCheck className="size-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">Items must be unworn with original tags attached</Text>
                    </li>
                    <li className="flex items-start gap-element">
                      <IconCheck className="size-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">Exchanges available for size/color (subject to stock)</Text>
                    </li>
                    <li className="flex items-start gap-element">
                      <IconCheck className="size-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">Free return shipping within Latvia</Text>
                    </li>
                    <li className="flex items-start gap-element">
                      <IconCheck className="size-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">EU customers pay return postage</Text>
                    </li>
                  </ul>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Row gap="group">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                    <IconPackageOff className="size-5 text-destructive" aria-hidden="true" />
                  </div>
                  <CardTitle>Damaged or Defective Items</CardTitle>
                </Row>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  <Text variant="body-md">
                    If you receive a damaged or defective item, we&apos;ll make it right immediately.
                  </Text>
                  <ul className="flex flex-col gap-group">
                    <li className="flex items-start gap-element">
                      <IconAlertTriangle className="size-5 text-warning flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">Report within 48 hours of delivery with photos</Text>
                    </li>
                    <li className="flex items-start gap-element">
                      <IconCheck className="size-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">Full replacement or refund offered (your choice)</Text>
                    </li>
                    <li className="flex items-start gap-element">
                      <IconCheck className="size-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">No return shipping needed — keep or dispose of item</Text>
                    </li>
                    <li className="flex items-start gap-element">
                      <IconCheck className="size-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">Wrong item sent: free replacement shipped immediately</Text>
                    </li>
                  </ul>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Container>
      </Section>

      <Section spacing="default" background="muted">
        <Container>
          <Stack gap="lg">
            <Text as="h2" variant="heading-lg" align="center">How to Return</Text>
            <Text variant="muted" align="center" className="max-w-2xl mx-auto">
              Follow these simple steps to process your return
            </Text>

            <Grid cols={4} gap="group">
              {returnSteps.map((item) => (
                <Card key={item.step}>
                  <CardContent className="pt-6">
                    <Stack gap="sm" align="center">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                        {item.step}
                      </div>
                      <Text variant="heading-xs" align="center">{item.title}</Text>
                      <Text variant="muted-sm" align="center">{item.description}</Text>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      <Section spacing="default">
        <Container>
          <Grid cols={2} gap="xl">
            <Stack gap="md">
              <Text as="h2" variant="heading-md">Refund Information</Text>
              <Text variant="body-md">
                Once we receive your returned item, our team will inspect it and process your refund within 5-10 business days.
              </Text>
              <ul className="flex flex-col gap-element">
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">Refunds are issued to the original payment method</Text>
                </li>
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">Original shipping costs are non-refundable (unless item was defective)</Text>
                </li>
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">Bank processing may take additional 3-5 business days</Text>
                </li>
              </ul>
            </Stack>

            <Stack gap="md">
              <Text as="h2" variant="heading-md">Exchanges</Text>
              <Text variant="body-md">
                Want a different size or color? We offer exchanges subject to stock availability.
              </Text>
              <ul className="flex flex-col gap-element">
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">Contact us before shipping to confirm availability</Text>
                </li>
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">Replacement shipped upon receipt of returned item</Text>
                </li>
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">Price differences will be charged or refunded accordingly</Text>
                </li>
              </ul>
            </Stack>
          </Grid>
        </Container>
      </Section>
    </>
  );
}
