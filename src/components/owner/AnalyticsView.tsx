import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsViewProps {
  orgName: string;
  stats: {
    totalTips: number;
    totalReviews: number;
    avgRating: number;
  };
  currency: string;
}

export function AnalyticsView({ orgName, stats, currency }: AnalyticsViewProps) {
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Coming soon",
      description: "CSV export will be available shortly",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Analytics</h2>
          <p className="text-muted-foreground">{orgName} performance insights</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="rounded-full" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Time Period Selector */}
      <Card className="glass-panel border-none">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["Today", "This Week", "This Month", "Last 30 Days", "All Time"].map((period) => (
              <Button
                key={period}
                variant={period === "Last 30 Days" ? "default" : "outline"}
                size="sm"
                className="rounded-full whitespace-nowrap"
              >
                <Calendar className="mr-2 h-3 w-3" />
                {period}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="glass-panel border-none">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {currency} {(stats.totalTips / 100).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Total Tips</p>
              <div className="flex items-center justify-center gap-1 text-xs text-success mt-2">
                <TrendingUp className="h-3 w-3" />
                <span>+12%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-none">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{stats.totalReviews}</div>
              <p className="text-xs text-muted-foreground">Reviews</p>
              <div className="flex items-center justify-center gap-1 text-xs text-success mt-2">
                <TrendingUp className="h-3 w-3" />
                <span>+8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-none">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{stats.avgRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
              <div className="flex items-center justify-center gap-1 text-xs text-success mt-2">
                <TrendingUp className="h-3 w-3" />
                <span>+0.3</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card className="glass-panel border-none">
        <CardHeader>
          <CardTitle className="text-lg">Tips Over Time</CardTitle>
          <CardDescription>Daily breakdown of tips received</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted/20 rounded-xl flex items-center justify-center border border-border/30">
            <p className="text-sm text-muted-foreground">Chart coming soon</p>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown by Day */}
      <Card className="glass-panel border-none">
        <CardHeader>
          <CardTitle className="text-lg">Breakdown by Day of Week</CardTitle>
          <CardDescription>Which days are busiest</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => {
              const value = Math.random() * 100;
              return (
                <div key={day}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{day}</span>
                    <span className="text-sm text-muted-foreground">{currency} {value.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      <Card className="glass-panel border-none bg-accent/5">
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <TrendingUp className="h-12 w-12 text-muted-foreground/50 mx-auto" />
            <div>
              <h3 className="font-semibold mb-1">More insights coming soon</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Once you have more data, we'll show hourly breakdowns, rating distributions, and more
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
