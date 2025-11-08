import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, MessageSquare, TrendingUp } from "lucide-react";

interface VenueStatsCardProps {
  orgName: string;
  orgSlug: string;
  serverCount: number;
  tipCount: number;
  reviewCount: number;
  totalTips: number;
  currency: string;
}

export function VenueStatsCard({ 
  orgName, 
  orgSlug, 
  serverCount, 
  tipCount, 
  reviewCount, 
  totalTips, 
  currency 
}: VenueStatsCardProps) {
  return (
    <Card className="glass-panel border-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{orgName}</span>
          <span className="text-sm font-normal text-muted-foreground">/{orgSlug}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Staff</span>
            </div>
            <p className="text-2xl font-bold">{serverCount}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Tips</span>
            </div>
            <p className="text-2xl font-bold">{tipCount}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent-foreground" />
              <span className="text-xs text-muted-foreground">Reviews</span>
            </div>
            <p className="text-2xl font-bold">{reviewCount}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-lg font-bold">${(totalTips / 100).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{currency}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}