import { Card, CardContent } from "@/components/ui/card";
import { Star, DollarSign, MessageSquare, TrendingUp } from "lucide-react";

interface VenueKPICardsProps {
  avgRating: number;
  totalTips: number;
  totalReviews: number;
  currency: string;
}

export function VenueKPICards({ avgRating, totalTips, totalReviews, currency }: VenueKPICardsProps) {
  const kpis = [
    {
      icon: Star,
      label: "Average Rating",
      value: avgRating.toFixed(1),
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      icon: DollarSign,
      label: "Total Tips",
      value: `${currency} ${(totalTips / 100).toFixed(2)}`,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: MessageSquare,
      label: "Total Reviews",
      value: totalReviews.toString(),
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: TrendingUp,
      label: "Growth",
      value: "+12%",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="glass-card border-none overflow-hidden group hover:scale-[1.02] transition-transform">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className={`h-12 w-12 rounded-xl ${kpi.bgColor} flex items-center justify-center`}>
                <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
