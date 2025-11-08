import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign } from "lucide-react";

interface EarningsCardProps {
  amount: number;
  currency: string;
  label: string;
  trend?: number;
}

export function EarningsCard({ amount, currency, label, trend }: EarningsCardProps) {
  return (
    <Card className="glass-panel border-none">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="number-display text-3xl">${amount.toFixed(2)}</p>
            <span className="text-sm text-muted-foreground">{currency}</span>
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-success font-medium">+{trend}%</span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}