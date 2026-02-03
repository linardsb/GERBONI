import Link from "next/link";
import { Grid } from "@/components/elements/grid";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";

interface City {
  name: string;
  nameLv: string;
  emoji: string;
}

interface CityGridProps {
  cities: City[];
}

export function CityGrid({ cities }: CityGridProps) {
  return (
    <Grid cols={4} gap="lg" className="lg:grid-cols-5">
      {cities.map((city) => (
        <Link
          key={city.name}
          href={`/products?city=${city.name.toLowerCase()}`}
          className="group p-group"
        >
          <Stack gap="lg" align="center" className="text-center">
            <div className="flex size-20 items-center justify-center border border-border-subtle group-hover:border-foreground transition-colors">
              <Text variant="emoji">{city.emoji}</Text>
            </div>
            <Stack gap="xs" align="center">
              <Text as="h3" variant="display-sm" className="group-hover:text-primary transition-colors">
                {city.name}
              </Text>
              <Text variant="fine">{city.nameLv}</Text>
            </Stack>
          </Stack>
        </Link>
      ))}
    </Grid>
  );
}
