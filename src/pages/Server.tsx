import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, User, DollarSign, MessageSquare, MapPin, Building2 } from "lucide-react";

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

  const totalEarned = tips.reduce((sum, tip) => sum + tip.amount_cents, 0);
  const positiveReviews = reviews.filter((r) => r.sentiment === "positive").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Server Dashboard</h1>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <Badge variant="default">{role}</Badge>
                </div>
                {profile ? (
                  <>
                    {profile.bio && (
                      <div className="flex items-start gap-2 pt-2">
                        <span className="text-sm text-muted-foreground">Bio:</span>
                        <span className="text-sm">{profile.bio}</span>
                      </div>
                    )}
                    {profile.global_wallet_address && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Wallet:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {profile.global_wallet_address}
                        </code>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No profile created yet.</p>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-8 w-8 text-success" />
                    <div>
                      <p className="text-2xl font-bold">{(totalEarned / 100).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Total Tips (EUR)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{reviews.length}</p>
                      <p className="text-sm text-muted-foreground">Reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-accent-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{assignments.length}</p>
                      <p className="text-sm text-muted-foreground">Assignments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Assignments</CardTitle>
                <CardDescription>Organizations where you're currently or previously assigned</CardDescription>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No assignments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between border border-border rounded-lg p-4"
                      >
                        <div>
                          <h3 className="font-semibold">{assignment.org.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {assignment.location?.name || "No location"} •{" "}
                            {assignment.display_name_override || "Default name"}
                          </p>
                        </div>
                        <Badge variant={assignment.is_active ? "default" : "secondary"}>
                          {assignment.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Recent Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tips.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No tips yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {tips.map((tip, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="text-sm text-muted-foreground">
                            {new Date(tip.created_at).toLocaleDateString()}
                          </span>
                          <span className="font-semibold text-success">
                            {(tip.amount_cents / 100).toFixed(2)} {tip.currency}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recent Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No reviews yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((review, idx) => (
                        <div key={idx} className="border border-border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
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
