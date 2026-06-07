import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({
  rating,
  count,
  size = 14,
  className,
}: {
  rating: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.round(rating);
          return (
            <Star
              key={i}
              size={size}
              className={filled ? "fill-amber-400 text-amber-400" : "fill-surface-muted text-surface-muted"}
            />
          );
        })}
      </div>
      <span className="text-xs font-semibold text-ink">{rating.toFixed(1)}</span>
      {typeof count === "number" && (
        <span className="text-xs text-ink-muted">({count})</span>
      )}
    </div>
  );
}
