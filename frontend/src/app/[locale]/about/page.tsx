"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/elements/container";
import { Section } from "@/components/elements/section";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { Card, CardContent } from "@/components/elements/card";
import { Grid } from "@/components/elements/grid";
import { Badge } from "@/components/elements/badge";
import { IconLeaf, IconHeart, IconShield, IconMapPin } from "@/components/icons";
import Image from "next/image";

const cities = [
  "Rīga", "Daugavpils", "Jelgava", "Jēkabpils", "Jūrmala",
  "Liepāja", "Ogre", "Rēzekne", "Valmiera", "Ventspils"
];

export default function AboutPage() {
  const t = useTranslations("about");

  const values = [
    {
      icon: IconHeart,
      title: t("valueHeritage"),
      description: t("valueHeritageDesc"),
    },
    {
      icon: IconShield,
      title: t("valueQuality"),
      description: t("valueQualityDesc"),
    },
    {
      icon: IconLeaf,
      title: t("valueSustainability"),
      description: t("valueSustainabilityDesc"),
    },
    {
      icon: IconMapPin,
      title: t("valueLocalPride"),
      description: t("valueLocalPrideDesc"),
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <Section spacing="large">
        <Container>
          <Grid cols={2} gap="xl" className="items-center">
            <Stack gap="group">
              <Badge variant="secondary">{t("badge")}</Badge>
              <Text as="h1" variant="display-md">
                {t("heroTitle")}
              </Text>
              <Stack gap="md">
                <Text variant="body-lg">
                  {t("heroP1")}
                </Text>
                <Text variant="muted">
                  {t("heroP2")}
                </Text>
                <Text variant="muted">
                  {t("heroP3")}
                </Text>
              </Stack>
            </Stack>
            <Stack gap="group">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-5 gap-element p-section bg-muted">
                    {cities.map((city) => (
                      <div key={city} className="aspect-square bg-background rounded-lg flex items-center justify-center p-element">
                        <Image
                          src={`/coats/${city.toLowerCase().replace('ī', 'i').replace('ā', 'a').replace('ē', 'e').replace('ū', 'u')}.svg`}
                          alt={`${city} coat of arms`}
                          width={48}
                          height={48}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/coats/placeholder.svg";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Text variant="muted-sm" align="center">
                {t("coatsCaption")}
              </Text>
            </Stack>
          </Grid>
        </Container>
      </Section>

      {/* Values Section */}
      <Section spacing="default" background="muted">
        <Container>
          <Stack gap="section">
            <Stack gap="element" align="center">
              <Text as="h2" variant="heading-lg">{t("valuesTitle")}</Text>
              <Text variant="muted">{t("valuesSubtitle")}</Text>
            </Stack>

            <Grid cols={4} gap="lg">
              {values.map((value) => (
                <Card key={value.title}>
                  <CardContent className="pt-6">
                    <Stack gap="sm" align="center">
                      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                        <value.icon className="size-6 text-primary" aria-hidden="true" />
                      </div>
                      <Text variant="heading-xs" align="center">{value.title}</Text>
                      <Text variant="muted-sm" align="center">{value.description}</Text>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      {/* Product Quality Section */}
      <Section spacing="default">
        <Container>
          <Grid cols={2} gap="xl" className="items-center">
            <Card>
              <CardContent className="pt-6">
                <Stack gap="group">
                  <Text as="h3" variant="heading-sm">{t("specsTitle")}</Text>
                  <Stack gap="group">
                    <Row gap="group" align="start">
                      <Badge variant="secondary">{t("specMaterialLabel")}</Badge>
                      <Text variant="muted">{t("specMaterialText")}</Text>
                    </Row>
                    <Row gap="group" align="start">
                      <Badge variant="secondary">{t("specPrintLabel")}</Badge>
                      <Text variant="muted">{t("specPrintText")}</Text>
                    </Row>
                    <Row gap="group" align="start">
                      <Badge variant="secondary">{t("specOriginLabel")}</Badge>
                      <Text variant="muted">{t("specOriginText")}</Text>
                    </Row>
                    <Row gap="group" align="start">
                      <Badge variant="secondary">{t("specFitLabel")}</Badge>
                      <Text variant="muted">{t("specFitText")}</Text>
                    </Row>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Stack gap="group">
              <Text as="h2" variant="heading-lg">
                {t("qualityTitle")}
              </Text>
              <Stack gap="md">
                <Text variant="body-md">
                  {t("qualityP1")}
                </Text>
                <Text variant="muted">
                  {t("qualityP2")}
                </Text>
                <Text variant="muted">
                  {t("qualityP3")}
                </Text>
              </Stack>
            </Stack>
          </Grid>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section spacing="default" background="accent">
        <Container>
          <Stack gap="group" align="center" className="max-w-2xl mx-auto">
            <Text as="h2" variant="heading-lg" align="center">{t("ctaTitle")}</Text>
            <Text variant="muted" align="center">
              {t("ctaDescription")}
            </Text>
            <Row wrap="wrap" justify="center" gap="element">
              {cities.map((city) => (
                <Badge key={city} variant="outline" className="text-sm px-3 py-1">
                  {city}
                </Badge>
              ))}
            </Row>
          </Stack>
        </Container>
      </Section>
    </>
  );
}
