"use client";

import { useTranslations } from "next-intl";
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
import { Link } from "@/i18n/routing";
import { IconPackage, IconTruck, IconRefresh, IconCreditCard, IconShirt, IconHelp } from "@/components/icons";

export default function FAQPage() {
  const t = useTranslations("faq");

  const faqCategories = [
    {
      category: t("ordersShipping.title"),
      icon: <IconTruck className="h-5 w-5 text-primary" />,
      items: [
        { question: t("ordersShipping.q1"), answer: t("ordersShipping.a1") },
        { question: t("ordersShipping.q2"), answer: t("ordersShipping.a2") },
        { question: t("ordersShipping.q3"), answer: t("ordersShipping.a3") },
        { question: t("ordersShipping.q4"), answer: t("ordersShipping.a4") },
        { question: t("ordersShipping.q5"), answer: t("ordersShipping.a5") },
      ],
    },
    {
      category: t("returnsRefunds.title"),
      icon: <IconRefresh className="h-5 w-5 text-primary" />,
      items: [
        { question: t("returnsRefunds.q1"), answer: t("returnsRefunds.a1") },
        { question: t("returnsRefunds.q2"), answer: t("returnsRefunds.a2") },
        { question: t("returnsRefunds.q3"), answer: t("returnsRefunds.a3") },
        { question: t("returnsRefunds.q4"), answer: t("returnsRefunds.a4") },
        { question: t("returnsRefunds.q5"), answer: t("returnsRefunds.a5") },
      ],
    },
    {
      category: t("productsSizing.title"),
      icon: <IconShirt className="h-5 w-5 text-primary" />,
      items: [
        { question: t("productsSizing.q1"), answer: t("productsSizing.a1") },
        { question: t("productsSizing.q2"), answer: t("productsSizing.a2") },
        { question: t("productsSizing.q3"), answer: t("productsSizing.a3") },
        { question: t("productsSizing.q4"), answer: t("productsSizing.a4") },
        { question: t("productsSizing.q5"), answer: t("productsSizing.a5") },
      ],
    },
    {
      category: t("paymentSecurity.title"),
      icon: <IconCreditCard className="h-5 w-5 text-primary" />,
      items: [
        { question: t("paymentSecurity.q1"), answer: t("paymentSecurity.a1") },
        { question: t("paymentSecurity.q2"), answer: t("paymentSecurity.a2") },
        { question: t("paymentSecurity.q3"), answer: t("paymentSecurity.a3") },
        { question: t("paymentSecurity.q4"), answer: t("paymentSecurity.a4") },
      ],
    },
    {
      category: t("accountSupport.title"),
      icon: <IconHelp className="h-5 w-5 text-primary" />,
      items: [
        { question: t("accountSupport.q1"), answer: t("accountSupport.a1") },
        { question: t("accountSupport.q2"), answer: t("accountSupport.a2") },
        { question: t("accountSupport.q3"), answer: t("accountSupport.a3") },
        { question: t("accountSupport.q4"), answer: t("accountSupport.a4") },
      ],
    },
    {
      category: t("bulkCustom.title"),
      icon: <IconPackage className="h-5 w-5 text-primary" />,
      items: [
        { question: t("bulkCustom.q1"), answer: t("bulkCustom.a1") },
        { question: t("bulkCustom.q2"), answer: t("bulkCustom.a2") },
        { question: t("bulkCustom.q3"), answer: t("bulkCustom.a3") },
      ],
    },
  ];

  return (
    <>
      <Section spacing="default">
        <Container>
          <PageHeader
            label={t("subtitle")}
            title={t("title")}
            description={t("description")}
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
                <Text as="h2" variant="heading-md">{t("stillHaveQuestions")}</Text>
                <Text variant="muted" align="center">
                  {t("stillHaveQuestionsDescription")}
                </Text>
                <Row gap="group" wrap="wrap" justify="center">
                  <Button asChild>
                    <Link href="/contact">{t("contactSupport")}</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="mailto:support@gerboni.lv">{t("emailUs")}</a>
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
