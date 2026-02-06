"use client";

import { useState } from "react";
import { IconThumbUp, IconCheck } from "@/components/icons";
import { Card, CardContent } from "@/components/elements/card";
import { Text } from "@/components/elements/text";
import { Stack } from "@/components/elements/stack";
import { Row } from "@/components/elements/row";
import { Badge } from "@/components/elements/badge";
import { Button } from "@/components/elements/button";
import { ReviewStars } from "@/components/elements/review-stars";
import { markReviewHelpful, type Review } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { token, guestSession } = useAuthStore();
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [hasMarkedHelpful, setHasMarkedHelpful] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleMarkHelpful = async () => {
    if (hasMarkedHelpful) return;

    setIsMarking(true);
    try {
      const result = await markReviewHelpful(
        review.id,
        token,
        guestSession?.session_token
      );
      setHelpfulCount(result.helpful_count);
      setHasMarkedHelpful(result.user_marked_helpful);
    } catch (err) {
      toast.error("Failed to mark review as helpful");
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <Card data-slot="review-card">
      <CardContent className="p-4">
        <Stack gap="group">
          {/* Header */}
          <Row justify="between" align="start">
            <Stack gap="element">
              <Row gap="group" align="center">
                <ReviewStars rating={review.rating} size="sm" />
                {review.is_verified_purchase && (
                  <Badge variant="outline" className="text-xs">
                    <IconCheck className="size-3 mr-1" aria-hidden="true" />
                    Verified Purchase
                  </Badge>
                )}
              </Row>
              {review.title && (
                <Text variant="body-md" className="font-medium">
                  {review.title}
                </Text>
              )}
            </Stack>
            <Text variant="muted-sm">{formatDate(review.created_at)}</Text>
          </Row>

          {/* Content */}
          {review.content && (
            <Text variant="body-sm" className="text-muted-foreground">
              {review.content}
            </Text>
          )}

          {/* Footer */}
          <Row justify="between" align="center" className="pt-2 border-t border-border-subtle">
            <Text variant="muted-sm">
              By {review.author_name}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkHelpful}
              disabled={isMarking || hasMarkedHelpful}
              className={hasMarkedHelpful ? "text-primary" : ""}
            >
              <IconThumbUp
                className="size-4 mr-1"
                aria-hidden="true"
              />
              Helpful ({helpfulCount})
            </Button>
          </Row>
        </Stack>
      </CardContent>
    </Card>
  );
}
