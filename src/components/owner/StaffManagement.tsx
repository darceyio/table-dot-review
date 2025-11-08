import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Star } from "lucide-react";

interface StaffMember {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  totalTips: number;
  avgRating: number;
  reviewCount: number;
  isActive: boolean;
}

interface StaffManagementProps {
  staff: StaffMember[];
  currency: string;
  onAddStaff: () => void;
}

export function StaffManagement({ staff, currency, onAddStaff }: StaffManagementProps) {
  return (
    <Card className="glass-panel border-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Staff Management
            </CardTitle>
            <CardDescription>Manage your team members</CardDescription>
          </div>
          <Button onClick={onAddStaff} size="sm" className="rounded-full">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {staff.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/30 hover:bg-card/50 transition-colors"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {member.displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <p className="font-semibold">{member.displayName}</p>
                  <Badge variant={member.isActive ? "default" : "outline"} className="text-xs mt-1">
                    {member.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Tips</p>
                  <p className="font-bold">{currency} {(member.totalTips / 100).toFixed(2)}</p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <div className="flex items-center gap-1 justify-center md:justify-end">
                    <Star className="h-4 w-4 text-warning fill-warning" />
                    <span className="font-bold">{member.avgRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({member.reviewCount})</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {staff.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">No staff yet</p>
                <p className="text-sm text-muted-foreground">Add your first team member to get started</p>
              </div>
              <Button onClick={onAddStaff} variant="outline" className="rounded-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Staff Member
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
