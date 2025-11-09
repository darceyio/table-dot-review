import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  server_name: string;
  server_avatar: string | null;
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
            <CardContent className="p-6">
              <div className="flex gap-4">
                {/* Server Avatar */}
                <Avatar className="h-12 w-12 shrink-0 ring-2 ring-border/50">
                  <AvatarImage src={review.server_avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {review.server_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  {/* Header: Server name, emoji, time */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">
                        {review.server_name}
                      </span>
                      <span className="text-3xl leading-none">
                        {getSentimentEmoji(review.sentiment, review.rating_emoji)}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`${getSentimentColor(review.sentiment)} capitalize text-xs`}
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
                    <p className="text-foreground/90 leading-relaxed mb-3">
                      "{review.comment}"
                    </p>
                  )}

                  {/* Tip Badge */}
                  {tipInUSD && (
                    <Badge 
                      variant="secondary" 
                      className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                    >
                      💵 Tipped {formatUSD(tipInUSD)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
