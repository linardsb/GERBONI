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
import { IconRefresh, IconPackageOff, IconAlertTriangle, IconCheck } from "@/components/icons";

export default function ReturnsPage() {
  const t = useTranslations("returns");

  const returnSteps = [
    { step: 1, title: t("steps.step1.title"), description: t("steps.step1.description") },
    { step: 2, title: t("steps.step2.title"), description: t("steps.step2.description") },
    { step: 3, title: t("steps.step3.title"), description: t("steps.step3.description") },
    { step: 4, title: t("steps.step4.title"), description: t("steps.step4.description") },
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

          <Grid cols={2} gap="xl">
            <Card>
              <CardHeader>
                <Row gap="group">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconRefresh className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle>{t("policy.title")}</CardTitle>
                </Row>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  <Row gap="group">
                    <Badge variant="secondary">{t("policy.window")}</Badge>
                    <Text variant="muted">{t("policy.windowDescription")}</Text>
                  </Row>
                  <ul className="flex flex-col gap-group">
                    <li className="flex items-start gap-element">
                      <IconCheck className="size-5 text-success flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">{t("policy.condition1")}</Text>
                    </li>
                    <li className="flex items-start gap-element">
                      <IconCheck className="size-5 text-success flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">{t("policy.condition2")}</Text>
                    </li>
                    <li className="flex items-start gap-element">
                      <IconCheck className="size-5 text-success flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">{t("policy.condition3")}</Text>
                    </li>
                    <li className="flex items-start gap-element">
                      <IconCheck className="size-5 text-success flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">{t("policy.condition4")}</Text>
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
                  <CardTitle>{t("damaged.title")}</CardTitle>
                </Row>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  <Text variant="body-md">{t("damaged.description")}</Text>
                  <ul className="flex flex-col gap-group">
                    <li className="flex items-start gap-element">
                      <IconAlertTriangle className="size-5 text-warning flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">{t("damaged.item1")}</Text>
                    </li>
                    <li className="flex items-start gap-element">
                      <IconCheck className="size-5 text-success flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">{t("damaged.item2")}</Text>
                    </li>
                    <li className="flex items-start gap-element">
                      <IconCheck className="size-5 text-success flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">{t("damaged.item3")}</Text>
                    </li>
                    <li className="flex items-start gap-element">
                      <IconCheck className="size-5 text-success flex-shrink-0" aria-hidden="true" />
                      <Text variant="body-md">{t("damaged.item4")}</Text>
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
            <Text as="h2" variant="heading-lg" align="center">{t("howTo.title")}</Text>
            <Text variant="muted" align="center" className="max-w-2xl mx-auto">
              {t("howTo.description")}
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
              <Text as="h2" variant="heading-md">{t("refunds.title")}</Text>
              <Text variant="body-md">{t("refunds.description")}</Text>
              <ul className="flex flex-col gap-element">
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">{t("refunds.item1")}</Text>
                </li>
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">{t("refunds.item2")}</Text>
                </li>
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">{t("refunds.item3")}</Text>
                </li>
              </ul>
            </Stack>

            <Stack gap="md">
              <Text as="h2" variant="heading-md">{t("exchanges.title")}</Text>
              <Text variant="body-md">{t("exchanges.text")}</Text>
              <ul className="flex flex-col gap-element">
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">{t("exchanges.item1")}</Text>
                </li>
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">{t("exchanges.item2")}</Text>
                </li>
                <li className="flex items-start gap-element">
                  <span className="text-primary">•</span>
                  <Text variant="muted">{t("exchanges.item3")}</Text>
                </li>
              </ul>
            </Stack>
          </Grid>
        </Container>
      </Section>
    </>
  );
}
