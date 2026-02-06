import type { IconComponent } from "@/components/icons";
import { Section } from "@/components/elements/section";
import { Grid } from "@/components/elements/grid";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";

interface Feature {
  icon: IconComponent;
  title: string;
  description: string;
}

interface FeatureGridProps {
  features: Feature[];
}

export function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <Section spacing="default" background="accent" className="border-y border-border-subtle">
      <div className="container">
        <Grid cols={3} gap="lg">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Stack key={index} gap="lg" align="center" className="text-center">
                <div className="flex size-14 items-center justify-center border border-border-subtle">
                  <IconComponent className="size-6 text-foreground" />
                </div>
                <Stack gap="sm">
                  <Text as="h3" variant="label">{feature.title}</Text>
                  <Text variant="fine" className="leading-relaxed">{feature.description}</Text>
                </Stack>
              </Stack>
            );
          })}
        </Grid>
      </div>
    </Section>
  );
}
