import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, Building2, MapPin, Users, DollarSign, MessageSquare } from "lucide-react";

interface Org {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  currency: string | null;
}

interface Stats {
  serverCount: number;
  tipCount: number;
  reviewCount: number;
  totalTips: number;
}

export default function Owner() {
  const { user, role, signOut } = useAuth();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load organizations owned by this user
    const { data: orgData, error: orgError } = await supabase
      .from("org")
      .select("*")
      .eq("owner_user_id", user.id);

    if (!orgError && orgData) {
      setOrgs(orgData);

      // Load stats for each org
      const statsPromises = orgData.map(async (org) => {
        const [assignments, tips, reviews] = await Promise.all([
          supabase.from("server_assignment").select("*", { count: "exact", head: true }).eq("org_id", org.id),
          supabase.from("tip").select("amount_cents", { count: "exact" }).eq("org_id", org.id),
          supabase.from("review").select("*", { count: "exact", head: true }).eq("org_id", org.id),
        ]);

        const totalTips = tips.data?.reduce((sum, tip) => sum + (tip.amount_cents || 0), 0) || 0;

        return {
          orgId: org.id,
          stats: {
            serverCount: assignments.count || 0,
            tipCount: tips.count || 0,
            reviewCount: reviews.count || 0,
            totalTips,
          },
        };
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap: Record<string, Stats> = {};
      statsResults.forEach(({ orgId, stats }) => {
        statsMap[orgId] = stats;
      });
      setStats(statsMap);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Owner Dashboard</h1>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Info</CardTitle>
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
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4">Your Organizations</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : orgs.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No organizations assigned yet. Contact an admin to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orgs.map((org) => {
                const orgStats = stats[org.id] || {
                  serverCount: 0,
                  tipCount: 0,
                  reviewCount: 0,
                  totalTips: 0,
                };

                return (
                  <Card key={org.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {org.name}
                      </CardTitle>
                      <CardDescription>
                        /{org.slug} • {org.country || "No country"} • {org.currency}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg">
                          <Users className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-2xl font-bold">{orgStats.serverCount}</p>
                            <p className="text-xs text-muted-foreground">Staff</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-success/10 p-3 rounded-lg">
                          <DollarSign className="h-5 w-5 text-success" />
                          <div>
                            <p className="text-2xl font-bold">{orgStats.tipCount}</p>
                            <p className="text-xs text-muted-foreground">Tips</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-accent/50 p-3 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-accent-foreground" />
                          <div>
                            <p className="text-2xl font-bold">{orgStats.reviewCount}</p>
                            <p className="text-xs text-muted-foreground">Reviews</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-primary/10 p-3 rounded-lg">
                          <DollarSign className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-lg font-bold">
                              {(orgStats.totalTips / 100).toFixed(2)} {org.currency}
                            </p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Card className="border-accent bg-accent/5">
          <CardHeader>
            <CardTitle className="text-sm">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>• Add locations to your organizations</p>
            <p>• Invite and assign servers to locations</p>
            <p>• Generate QR codes for server assignments</p>
            <p>• Monitor tips and reviews in real-time</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
