import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";

interface ServerStats {
  server_id: string;
  display_name: string;
  avatar_url: string | null;
  total_tips_cents: number;
  review_count: number;
  avg_sentiment: string;
}

interface TopServersLeaderboardProps {
  servers: ServerStats[];
  currency?: string;
}

export function TopServersLeaderboard({ servers, currency = "EUR" }: TopServersLeaderboardProps) {
  const sortedServers = [...servers].sort((a, b) => b.total_tips_cents - a.total_tips_cents);
  
  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-yellow-500";
      case 1:
        return "text-gray-400";
      case 2:
        return "text-amber-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "😊";
      case "neutral":
        return "😐";
      case "negative":
        return "😞";
      default:
        return "😐";
    }
  };

  const formatAmount = (cents: number) => {
    const symbol = currency === "EUR" ? "€" : "$";
    return `${symbol}${(cents / 100).toFixed(0)}`;
  };

  if (sortedServers.length === 0) {
    return null;
  }

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Performing Servers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedServers.map((server, index) => (
          <div
            key={server.server_id}
            className="flex items-center gap-4 p-4 rounded-2xl bg-background/50 hover:bg-background/80 transition-colors"
          >
            {/* Rank */}
            <div className={`text-2xl font-bold w-8 ${getMedalColor(index)}`}>
              {index < 3 ? "🏆" : `#${index + 1}`}
            </div>

            {/* Avatar */}
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarImage src={server.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {server.display_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{server.display_name}</p>
                <span className="text-xl">{getSentimentEmoji(server.avg_sentiment)}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span>{server.review_count} reviews</span>
                {server.total_tips_cents > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {formatAmount(server.total_tips_cents)} tips
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Tip Amount Badge */}
            {server.total_tips_cents > 0 && (
              <Badge variant="secondary" className="text-lg font-bold px-4 py-2">
                {formatAmount(server.total_tips_cents)}
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
