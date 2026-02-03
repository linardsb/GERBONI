"use client";

import { useState } from "react";
import { Button } from "@/components/elements/button";
import { Input } from "@/components/elements/input";
import { Text } from "@/components/elements/text";
import { Stack } from "@/components/elements/stack";
import { ReviewStars } from "@/components/elements/review-stars";
import { createReview, type Review } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

interface ReviewFormProps {
  productId: number;
  orderId?: number | null;
  onSuccess: (review: Review) => void;
  onCancel?: () => void;
}

export function ReviewForm({
  productId,
  orderId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const { token, user } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Please log in to submit a review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const review = await createReview(
        productId,
        {
          rating,
          title: title.trim() || undefined,
          content: content.trim() || undefined,
          order_id: orderId || undefined,
        },
        token
      );
      toast.success("Review submitted successfully");
      onSuccess(review);
      // Reset form
      setRating(0);
      setTitle("");
      setContent("");
    } catch (err) {
      toast.error("Failed to submit review", {
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Stack gap="group" align="center" className="py-4 border rounded-lg">
        <Text variant="muted">Please log in to leave a review</Text>
        <Button asChild>
          <a href="/login">Log In</a>
        </Button>
      </Stack>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-slot="review-form">
      <Stack gap="group">
        <Text as="h4" variant="heading-xs">Write a Review</Text>

        {/* Rating */}
        <Stack gap="element">
          <Text variant="label">Your Rating *</Text>
          <ReviewStars
            rating={rating}
            size="lg"
            interactive
            onChange={setRating}
          />
        </Stack>

        {/* Title */}
        <Stack gap="element">
          <Text variant="label">Review Title (optional)</Text>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            maxLength={200}
          />
        </Stack>

        {/* Content */}
        <Stack gap="element">
          <Text variant="label">Your Review (optional)</Text>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tell others about your experience with this product..."
            className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            maxLength={2000}
          />
          <Text variant="muted-sm" align="right">
            {content.length}/2000
          </Text>
        </Stack>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || rating === 0}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </Stack>
    </form>
  );
}
