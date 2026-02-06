"use client";

import { IconStar, IconStarFilled, IconStarHalfFilled } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ReviewStarsProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const sizeClasses = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
};

export function ReviewStars({
  rating,
  size = "md",
  showValue = false,
  interactive = false,
  onChange,
  className,
}: ReviewStarsProps) {
  const iconSize = sizeClasses[size];

  const handleClick = (starIndex: number) => {
    if (interactive && onChange) {
      onChange(starIndex);
    }
  };

  const renderStar = (index: number) => {
    const filled = rating >= index;
    const halfFilled = rating >= index - 0.5 && rating < index;

    if (filled) {
      return (
        <IconStarFilled
          className={cn(iconSize, "text-amber-400")}
          aria-hidden="true"
        />
      );
    }
    if (halfFilled) {
      return (
        <IconStarHalfFilled
          className={cn(iconSize, "text-amber-400")}
          aria-hidden="true"
        />
      );
    }
    return (
      <IconStar
        className={cn(iconSize, "text-muted-foreground/30")}
        aria-hidden="true"
      />
    );
  };

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`Rating: ${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleClick(index)}
          disabled={!interactive}
          className={cn(
            "focus:outline-none",
            interactive && "cursor-pointer hover:scale-110 transition-transform"
          )}
          aria-label={interactive ? `Rate ${index} stars` : undefined}
        >
          {renderStar(index)}
        </button>
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
