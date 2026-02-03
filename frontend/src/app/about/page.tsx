"use client";

import { Container } from "@/components/elements/container";
import { Section } from "@/components/elements/section";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { Card, CardContent } from "@/components/elements/card";
import { Grid } from "@/components/elements/grid";
import { Badge } from "@/components/elements/badge";
import { IconLeaf, IconHeart, IconShield, IconMapPin } from "@tabler/icons-react";
import Image from "next/image";

// Note: Metadata moved to generateMetadata since this is a client component
// export const metadata = { ... }

const values = [
  {
    icon: IconHeart,
    title: "Heritage",
    description: "Every design celebrates the rich history and unique identity of Latvia's cities through their authentic coats of arms.",
  },
  {
    icon: IconShield,
    title: "Quality",
    description: "Premium 180 GSM organic cotton with DTG printing ensures your shirt looks great wash after wash.",
  },
  {
    icon: IconLeaf,
    title: "Sustainability",
    description: "Eco-friendly inks, organic materials, and ethical EU production minimize our environmental footprint.",
  },
  {
    icon: IconMapPin,
    title: "Local Pride",
    description: "Designed in Rīga, shipped from Latvia—supporting local business while sharing Latvian culture worldwide.",
  },
];

const cities = [
  "Rīga", "Daugavpils", "Jelgava", "Jēkabpils", "Jūrmala",
  "Liepāja", "Ogre", "Rēzekne", "Valmiera", "Ventspils"
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <Section spacing="large">
        <Container>
          <Grid cols={2} gap="xl" className="items-center">
            <Stack gap="group">
              <Badge variant="secondary">Our Story</Badge>
              <Text as="h1" variant="display-md">
                Wear Your Heritage with Pride
              </Text>
              <Stack gap="md">
                <Text variant="body-lg">
                  GERBONI was born from a simple idea: what if you could wear your connection to Latvia&apos;s beautiful cities?
                </Text>
                <Text variant="muted">
                  Each Latvian city has a coat of arms—a symbol rich with history, meaning, and local pride. These heraldic designs tell stories of trade routes, natural resources, and centuries of culture. We believed these symbols deserved to be celebrated, not just displayed in government buildings.
                </Text>
                <Text variant="muted">
                  That&apos;s why we created GERBONI: premium t-shirts featuring authentic coats of arms from Latvia&apos;s most beloved cities. Whether you&apos;re from Rīga, spent summers in Jūrmala, or simply fell in love with Latvian culture, there&apos;s a design that speaks to your story.
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
                Featuring authentic coats of arms from 10 Latvian cities
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
              <Text as="h2" variant="heading-lg">What We Stand For</Text>
              <Text variant="muted">Our commitment to quality, heritage, and sustainability</Text>
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
                  <Text as="h3" variant="heading-sm">Product Specifications</Text>
                  <Stack gap="group">
                    <Row gap="group" align="start">
                      <Badge variant="secondary">Material</Badge>
                      <Text variant="muted">100% organic cotton, 180 GSM medium weight—soft, breathable, and built to last</Text>
                    </Row>
                    <Row gap="group" align="start">
                      <Badge variant="secondary">Print</Badge>
                      <Text variant="muted">Direct-to-garment (DTG) with eco-friendly, wash-resistant inks that become part of the fabric</Text>
                    </Row>
                    <Row gap="group" align="start">
                      <Badge variant="secondary">Origin</Badge>
                      <Text variant="muted">Designed in Rīga, Latvia; ethically produced in the EU with fair labor practices</Text>
                    </Row>
                    <Row gap="group" align="start">
                      <Badge variant="secondary">Fit</Badge>
                      <Text variant="muted">Pre-shrunk fabric in sizes XS-XXL with slim to relaxed fits</Text>
                    </Row>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Stack gap="group">
              <Text as="h2" variant="heading-lg">
                Quality You Can Feel
              </Text>
              <Stack gap="md">
                <Text variant="body-md">
                  We obsess over every detail because we know you&apos;ll wear this shirt for years. The 180 GSM organic cotton strikes the perfect balance—substantial enough to feel premium, light enough for everyday comfort.
                </Text>
                <Text variant="muted">
                  Our DTG printing process uses eco-friendly inks that bond directly with the cotton fibers. Unlike screen printing that sits on top, our prints are literally part of the shirt. No cracking, no peeling, no fading—even after dozens of washes.
                </Text>
                <Text variant="muted">
                  And because sustainability matters, we chose organic cotton and water-based inks. Good for you, good for the planet.
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
            <Text as="h2" variant="heading-lg" align="center">Find Your City</Text>
            <Text variant="muted" align="center">
              Whether it&apos;s your hometown, a place you love to visit, or a city that holds special memories—there&apos;s a GERBONI shirt waiting for you.
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
