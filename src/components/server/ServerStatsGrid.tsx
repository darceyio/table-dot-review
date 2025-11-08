import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, MessageSquare, TrendingUp, Users } from "lucide-react";

interface ServerStatsGridProps {
  totalTips: number;
  reviewCount: number;
  avgRating: number;
  totalGuests: number;
}

export function ServerStatsGrid({ totalTips, reviewCount, avgRating, totalGuests }: ServerStatsGridProps) {
  const stats = [
    { icon: DollarSign, label: "Total Tips", value: `$${totalTips.toFixed(2)}`, color: "text-success" },
    { icon: MessageSquare, label: "Reviews", value: reviewCount.toString(), color: "text-primary" },
    { icon: TrendingUp, label: "Avg Rating", value: avgRating.toFixed(1), color: "text-accent-foreground" },
    { icon: Users, label: "Guests", value: totalGuests.toString(), color: "text-secondary" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="glass-panel border-none">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}