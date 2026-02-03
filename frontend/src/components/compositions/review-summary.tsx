"use client";

import { ReviewStars } from "@/components/elements/review-stars";
import { Text } from "@/components/elements/text";
import { Stack } from "@/components/elements/stack";
import { Row } from "@/components/elements/row";
import type { ReviewSummary as ReviewSummaryType } from "@/lib/api";

interface ReviewSummaryProps {
  summary: ReviewSummaryType;
}

export function ReviewSummary({ summary }: ReviewSummaryProps) {
  const { average_rating, total_reviews, rating_distribution } = summary;

  // Calculate percentages for distribution bars
  const maxCount = Math.max(...Object.values(rating_distribution), 1);

  if (total_reviews === 0) {
    return (
      <Stack gap="element" className="text-center py-4">
        <Text variant="muted">No reviews yet</Text>
        <Text variant="muted-sm">Be the first to review this product!</Text>
      </Stack>
    );
  }

  return (
    <Row gap="section" align="start" data-slot="review-summary">
      {/* Average Rating */}
      <Stack gap="element" align="center" className="min-w-[120px]">
        <Text variant="display-lg" className="font-bold">
          {average_rating.toFixed(1)}
        </Text>
        <ReviewStars rating={average_rating} size="md" />
        <Text variant="muted-sm">
          {total_reviews} {total_reviews === 1 ? "review" : "reviews"}
        </Text>
      </Stack>

      {/* Rating Distribution */}
      <Stack gap="element" className="flex-1">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = rating_distribution[stars] || 0;
          const percentage = total_reviews > 0 ? (count / total_reviews) * 100 : 0;

          return (
            <Row key={stars} gap="group" align="center">
              <Text variant="muted-sm" className="w-12">
                {stars} star
              </Text>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <Text variant="muted-sm" className="w-8 text-right">
                {count}
              </Text>
            </Row>
          );
        })}
      </Stack>
    </Row>
  );
}
