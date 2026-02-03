"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/elements/button";
import { Text } from "@/components/elements/text";
import { Stack } from "@/components/elements/stack";
import { Skeleton } from "@/components/elements/skeleton";
import { Separator } from "@/components/elements/separator";
import { Card, CardContent } from "@/components/elements/card";
import { ReviewCard } from "./review-card";
import { ReviewSummary } from "./review-summary";
import { ReviewForm } from "./review-form";
import {
  getProductReviews,
  canReviewProduct,
  type Review,
  type ReviewSummary as ReviewSummaryType,
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface ReviewListProps {
  productId: number;
}

export function ReviewList({ productId }: ReviewListProps) {
  const { token, user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [canReview, setCanReview] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const pageSize = 5;

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      try {
        const data = await getProductReviews(productId, page, pageSize);
        setReviews(data.reviews);
        setSummary(data.summary);
        setTotalPages(Math.ceil(data.total / pageSize));
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [productId, page]);

  // Check if user can review
  useEffect(() => {
    const checkCanReview = async () => {
      if (!token || !user) {
        setCanReview(false);
        return;
      }

      try {
        const result = await canReviewProduct(productId, token);
        setCanReview(result.can_review);
        setOrderId(result.order_id);
      } catch {
        setCanReview(false);
      }
    };

    checkCanReview();
  }, [productId, token, user]);

  const handleReviewSubmitted = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev]);
    if (summary) {
      setSummary({
        ...summary,
        total_reviews: summary.total_reviews + 1,
        average_rating:
          (summary.average_rating * summary.total_reviews + newReview.rating) /
          (summary.total_reviews + 1),
        rating_distribution: {
          ...summary.rating_distribution,
          [newReview.rating]: (summary.rating_distribution[newReview.rating] || 0) + 1,
        },
      });
    }
    setShowForm(false);
    setCanReview(false); // User can only review once
  };

  if (loading && page === 1) {
    return (
      <Stack gap="section" data-slot="review-list">
        <Text as="h3" variant="heading-md">Customer Reviews</Text>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Stack gap="group">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap="section" data-slot="review-list">
      <Text as="h3" variant="heading-md">Customer Reviews</Text>

      {/* Summary */}
      {summary && (
        <Card>
          <CardContent className="p-6">
            <ReviewSummary summary={summary} />
          </CardContent>
        </Card>
      )}

      {/* Write Review Button/Form */}
      {canReview && !showForm && (
        <Button onClick={() => setShowForm(true)} className="self-start">
          Write a Review
        </Button>
      )}

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <ReviewForm
              productId={productId}
              orderId={orderId}
              onSuccess={handleReviewSubmitted}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {!canReview && user && summary && summary.total_reviews > 0 && (
        <Text variant="muted-sm">
          You can only review products you&apos;ve purchased.
        </Text>
      )}

      <Separator />

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Stack gap="group" align="center" className="py-8">
          <Text variant="muted">No reviews yet</Text>
          {canReview && (
            <Button onClick={() => setShowForm(true)}>
              Be the first to review
            </Button>
          )}
        </Stack>
      ) : (
        <Stack gap="group">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </Stack>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <Text variant="muted-sm" className="flex items-center px-4">
            Page {page} of {totalPages}
          </Text>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </Stack>
  );
}
