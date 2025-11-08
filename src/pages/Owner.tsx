import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, Building2, MapPin, Users, DollarSign } from "lucide-react";
import { VenueStatsCard } from "@/components/owner/VenueStatsCard";

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
    <div className="min-h-screen gradient-soft">
      <header className="glass-panel border-none sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Business Owner</h1>
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
        ) : orgs.length === 0 ? (
          <Card className="glass-panel border-none">
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">No venues yet</h3>
                  <p className="text-muted-foreground">
                    Contact an admin to get your organization set up
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Your Venues</h2>
              <div className="space-y-4">
                {orgs.map((org) => {
                  const orgStats = stats[org.id] || {
                    serverCount: 0,
                    tipCount: 0,
                    reviewCount: 0,
                    totalTips: 0,
                  };

                  return (
                    <VenueStatsCard
                      key={org.id}
                      orgName={org.name}
                      orgSlug={org.slug}
                      serverCount={orgStats.serverCount}
                      tipCount={orgStats.tipCount}
                      reviewCount={orgStats.reviewCount}
                      totalTips={orgStats.totalTips}
                      currency={org.currency || "USD"}
                    />
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <Card className="glass-panel border-none bg-accent/10">
              <CardHeader>
                <CardTitle className="text-lg">Next Steps</CardTitle>
                <CardDescription>Grow your business with these actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium">Add locations</p>
                    <p className="text-sm text-muted-foreground">Organize your venues by physical location</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium">Invite staff</p>
                    <p className="text-sm text-muted-foreground">Assign servers to locations and generate QR codes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium">Monitor performance</p>
                    <p className="text-sm text-muted-foreground">Track tips, reviews, and staff performance in real-time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
