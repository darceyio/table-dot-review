import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp } from "lucide-react";

interface StaffMember {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  totalTips: number;
  avgRating: number;
  reviewCount: number;
}

interface StaffLeaderboardProps {
  staff: StaffMember[];
  currency: string;
}

export function StaffLeaderboard({ staff, currency }: StaffLeaderboardProps) {
  const sortedStaff = [...staff].sort((a, b) => b.totalTips - a.totalTips);

  return (
    <Card className="glass-panel border-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Staff Performance
            </CardTitle>
            <CardDescription>Top performers ranked by tips</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedStaff.slice(0, 5).map((member, index) => (
            <div
              key={member.id}
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <Badge
                  variant={index === 0 ? "default" : "outline"}
                  className="h-8 w-8 rounded-full flex items-center justify-center font-bold"
                >
                  {index + 1}
                </Badge>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {member.displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{member.displayName}</p>
                  <p className="text-xs text-muted-foreground">{member.reviewCount} reviews</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="font-bold text-lg">{currency} {(member.totalTips / 100).toFixed(2)}</p>
                <div className="flex items-center gap-1 justify-end">
                  <Star className="h-3 w-3 text-warning fill-warning" />
                  <span className="text-xs font-medium">{member.avgRating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
          {sortedStaff.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No staff data yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
