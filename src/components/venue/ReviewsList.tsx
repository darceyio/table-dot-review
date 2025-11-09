import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUSD, convertToUSD } from "@/lib/currencyConversion";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  created_at: string;
  rating_emoji: string | null;
  sentiment: string;
  comment: string | null;
  tip_amount_cents: number | null;
  tip_currency: string | null;
}

interface ReviewsListProps {
  reviews: Review[];
}

const getSentimentEmoji = (sentiment: string, ratingEmoji: string | null): string => {
  if (ratingEmoji) return ratingEmoji;
  
  switch (sentiment) {
    case "positive":
      return "😊";
    case "neutral":
      return "😐";
    case "negative":
      return "😞";
    default:
      return "⭐";
  }
};

const getSentimentColor = (sentiment: string): string => {
  switch (sentiment) {
    case "positive":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "neutral":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    case "negative":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function ReviewsList({ reviews }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <Card className="backdrop-blur-sm bg-card/70 border-border/50">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-lg">No reviews yet. Be the first to share your experience! ✨</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const tipInUSD = review.tip_amount_cents && review.tip_currency
          ? convertToUSD(review.tip_amount_cents, review.tip_currency)
          : null;

        return (
          <Card 
            key={review.id} 
            className="backdrop-blur-sm bg-card/70 border-border/50 hover:bg-card/80 transition-all duration-300"
          >
            <CardContent className="p-8">
              {/* Header: Emoji, Sentiment, Time */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-5xl leading-none">
                    {getSentimentEmoji(review.sentiment, review.rating_emoji)}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`${getSentimentColor(review.sentiment)} capitalize`}
                  >
                    {review.sentiment}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-foreground/90 text-lg leading-relaxed mb-4">
                  "{review.comment}"
                </p>
              )}

              {/* Tip Badge */}
              {tipInUSD && (
                <Badge 
                  variant="secondary" 
                  className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 text-base px-3 py-1"
                >
                  💵 Tipped {formatUSD(tipInUSD)}
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
