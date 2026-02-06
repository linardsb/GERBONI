"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/elements/container";
import { Section } from "@/components/elements/section";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/card";
import { PageHeader } from "@/components/compositions/page-header";
import { Grid } from "@/components/elements/grid";
import { Badge } from "@/components/elements/badge";
import { IconTruck, IconWorld, IconRocket, IconPackage } from "@/components/icons";

export default function ShippingPage() {
  const t = useTranslations("shipping");

  const shippingOptions = [
    {
      icon: IconTruck,
      title: t("options.latvia.title"),
      time: t("options.latvia.time"),
      price: t("options.latvia.price"),
      freeOver: t("options.latvia.freeOver"),
      highlight: true,
    },
    {
      icon: IconWorld,
      title: t("options.eu.title"),
      time: t("options.eu.time"),
      price: t("options.eu.price"),
      freeOver: t("options.eu.freeOver"),
    },
    {
      icon: IconRocket,
      title: t("options.express.title"),
      time: t("options.express.time"),
      price: t("options.express.price"),
      note: t("options.express.note"),
    },
  ];

  const internationalShipping = [
    {
      region: t("international.uk.region"),
      time: t("international.uk.time"),
      price: t("international.uk.price"),
      note: t("international.uk.note"),
    },
    {
      region: t("international.usCanada.region"),
      time: t("international.usCanada.time"),
      price: t("international.usCanada.price"),
      note: t("international.usCanada.note"),
    },
    {
      region: t("international.other.region"),
      time: t("international.other.time"),
      price: t("international.other.price"),
      note: t("international.other.note"),
    },
  ];

  return (
    <>
      <Section spacing="default">
        <Container>
          <PageHeader
            label={t("label")}
            title={t("title")}
            description={t("description")}
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
                        <Badge variant="secondary">{t("freeOver", { amount: option.freeOver })}</Badge>
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
            <Text as="h2" variant="heading-lg" align="center">{t("internationalTitle")}</Text>
            <Text variant="muted" align="center" className="max-w-2xl mx-auto">
              {t("internationalDescription")}
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
                <Text as="h2" variant="heading-md">{t("processing.title")}</Text>
              </Row>
              <Text variant="body-md">{t("processing.text1")}</Text>
              <Text variant="body-md">{t("processing.text2")}</Text>
            </Stack>

            <Stack gap="md">
              <Text as="h3" variant="heading-sm">{t("notes.title")}</Text>
              <ul className="flex flex-col gap-element">
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">{t("notes.item1")}</Text>
                </li>
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">{t("notes.item2")}</Text>
                </li>
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">{t("notes.item3")}</Text>
                </li>
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">{t("notes.item4")}</Text>
                </li>
              </ul>
            </Stack>
          </Grid>
        </Container>
      </Section>
    </>
  );
}
