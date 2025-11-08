import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, User, QrCode, ExternalLink } from "lucide-react";
import { EarningsCard } from "@/components/server/EarningsCard";
import { ServerStatsGrid } from "@/components/server/ServerStatsGrid";

interface ServerProfile {
  bio: string | null;
  global_wallet_address: string | null;
}

interface Assignment {
  id: string;
  display_name_override: string | null;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  org: { name: string };
  location: { name: string } | null;
}

interface Tip {
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
}

interface Review {
  sentiment: string;
  text: string | null;
  created_at: string;
}

export default function Server() {
  const { user, role, signOut } = useAuth();
  const [profile, setProfile] = useState<ServerProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [profileRes, assignmentsRes, tipsRes, reviewsRes] = await Promise.all([
      supabase.from("server_profile").select("*").eq("server_id", user.id).maybeSingle(),
      supabase.from("server_assignment").select("*, org(name), location(name)").eq("server_id", user.id),
      supabase.from("tip").select("*").eq("server_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("review").select("*").eq("server_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (assignmentsRes.data) setAssignments(assignmentsRes.data);
    if (tipsRes.data) setTips(tipsRes.data);
    if (reviewsRes.data) setReviews(reviewsRes.data);

    setLoading(false);
  };

  const totalEarned = tips.reduce((sum, tip) => sum + tip.amount_cents, 0) / 100;
  const positiveReviews = reviews.filter((r) => r.sentiment === "positive").length;
  const avgRating = reviews.length > 0 ? (positiveReviews / reviews.length) * 5 : 0;

  return (
    <div className="min-h-screen gradient-soft">
      <header className="glass-panel border-none sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Your Dashboard</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline" size="sm" className="rounded-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-6 max-w-6xl">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Earnings Overview */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Today's Earnings</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <EarningsCard amount={totalEarned} currency="USD" label="Total Tips" trend={12} />
                <EarningsCard amount={totalEarned * 0.3} currency="USD" label="This Week" />
                <EarningsCard amount={totalEarned * 2.5} currency="USD" label="All Time" />
              </div>
            </div>

            {/* Stats Grid */}
            <ServerStatsGrid
              totalTips={totalEarned}
              reviewCount={reviews.length}
              avgRating={avgRating}
              totalGuests={tips.length}
            />

            {/* QR Code Section */}
            {assignments.length > 0 && (
              <Card className="glass-panel border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Your QR Codes
                  </CardTitle>
                  <CardDescription>Guests can scan these to leave tips and reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {assignments.slice(0, 2).map((assignment) => (
                      <div key={assignment.id} className="bg-muted/30 rounded-xl p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold">{assignment.org.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {assignment.location?.name || "All locations"}
                          </p>
                        </div>
                        <Badge variant={assignment.is_active ? "default" : "secondary"}>
                          {assignment.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {assignment.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => window.open(`/r/${assignment.id}`, "_blank")}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View QR Page
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-panel border-none">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  {tips.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No tips yet</p>
                  ) : (
                    <div className="space-y-3">
                      {tips.slice(0, 5).map((tip, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                          <span className="text-sm text-muted-foreground">
                            {new Date(tip.created_at).toLocaleDateString()}
                          </span>
                          <span className="font-semibold text-success">
                            ${(tip.amount_cents / 100).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-panel border-none">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No reviews yet</p>
                  ) : (
                    <div className="space-y-3">
                      {reviews.slice(0, 5).map((review, idx) => (
                        <div key={idx} className="p-3 bg-muted/20 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge
                              variant={
                                review.sentiment === "positive"
                                  ? "default"
                                  : review.sentiment === "negative"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {review.sentiment}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {review.text && <p className="text-sm">{review.text}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
