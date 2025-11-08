import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogOut, Building2, LayoutDashboard, Users as UsersIcon, Settings } from "lucide-react";
import { VenueKPICards } from "@/components/owner/VenueKPICards";
import { StaffLeaderboard } from "@/components/owner/StaffLeaderboard";
import { StaffManagement } from "@/components/owner/StaffManagement";
import { VenueSettings } from "@/components/owner/VenueSettings";
import { useToast } from "@/hooks/use-toast";

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
  avgRating: number;
}

interface StaffMember {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  totalTips: number;
  avgRating: number;
  reviewCount: number;
  isActive: boolean;
}

export default function Owner() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [staffData, setStaffData] = useState<Record<string, StaffMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

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

      // Load stats and staff for each org
      const statsPromises = orgData.map(async (org) => {
        const [assignments, tips, reviews] = await Promise.all([
          supabase.from("server_assignment").select("server_id, is_active").eq("org_id", org.id),
          supabase.from("tip").select("amount_cents, server_id").eq("org_id", org.id),
          supabase.from("review").select("sentiment, server_id").eq("org_id", org.id),
        ]);

        const totalTips = tips.data?.reduce((sum, tip) => sum + (tip.amount_cents || 0), 0) || 0;
        
        // Calculate average rating (positive = 5, neutral = 3, negative = 1)
        const sentimentScores = { positive: 5, neutral: 3, negative: 1 };
        const reviewsWithScores = reviews.data?.map(r => sentimentScores[r.sentiment as keyof typeof sentimentScores] || 3) || [];
        const avgRating = reviewsWithScores.length > 0 
          ? reviewsWithScores.reduce((a, b) => a + b, 0) / reviewsWithScores.length 
          : 0;

        // Load staff details
        const serverIds = [...new Set(assignments.data?.map(a => a.server_id) || [])];
        const staffMembers: StaffMember[] = [];

        for (const serverId of serverIds) {
          const { data: userData } = await supabase
            .from("app_user")
            .select("display_name, avatar_url")
            .eq("id", serverId)
            .single();

          const serverTips = tips.data?.filter(t => t.server_id === serverId) || [];
          const serverReviews = reviews.data?.filter(r => r.server_id === serverId) || [];
          const serverTipTotal = serverTips.reduce((sum, tip) => sum + (tip.amount_cents || 0), 0);
          const serverReviewScores = serverReviews.map(r => sentimentScores[r.sentiment as keyof typeof sentimentScores] || 3);
          const serverAvgRating = serverReviewScores.length > 0
            ? serverReviewScores.reduce((a, b) => a + b, 0) / serverReviewScores.length
            : 0;

          const assignment = assignments.data?.find(a => a.server_id === serverId);

          staffMembers.push({
            id: serverId,
            displayName: userData?.display_name || "Unknown",
            avatarUrl: userData?.avatar_url || null,
            totalTips: serverTipTotal,
            avgRating: serverAvgRating,
            reviewCount: serverReviews.length,
            isActive: assignment?.is_active || false,
          });
        }

        return {
          orgId: org.id,
          stats: {
            serverCount: assignments.data?.length || 0,
            tipCount: tips.data?.length || 0,
            reviewCount: reviews.data?.length || 0,
            totalTips,
            avgRating,
          },
          staff: staffMembers,
        };
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap: Record<string, Stats> = {};
      const staffMap: Record<string, StaffMember[]> = {};
      statsResults.forEach(({ orgId, stats, staff }) => {
        statsMap[orgId] = stats;
        staffMap[orgId] = staff;
      });
      setStats(statsMap);
      setStaffData(staffMap);

      // Select first org by default
      if (orgData.length > 0 && !selectedOrg) {
        setSelectedOrg(orgData[0].id);
      }
    }

    setLoading(false);
  };

  const handleUpdateVenue = async (orgId: string, data: { name: string; slug: string; country: string }) => {
    const { error } = await supabase
      .from("org")
      .update(data)
      .eq("id", orgId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update venue settings",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Venue settings updated",
      });
      loadData();
    }
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
            {/* Venue Selector */}
            {orgs.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {orgs.map((org) => (
                  <Button
                    key={org.id}
                    variant={selectedOrg === org.id ? "default" : "outline"}
                    onClick={() => setSelectedOrg(org.id)}
                    className="rounded-full whitespace-nowrap"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {org.name}
                  </Button>
                ))}
              </div>
            )}

            {selectedOrg && (() => {
              const org = orgs.find(o => o.id === selectedOrg)!;
              const orgStats = stats[selectedOrg] || {
                serverCount: 0,
                tipCount: 0,
                reviewCount: 0,
                totalTips: 0,
                avgRating: 0,
              };
              const staff = staffData[selectedOrg] || [];

              return (
                <Tabs defaultValue="dashboard" className="space-y-6">
                  <TabsList className="glass-card border-none">
                    <TabsTrigger value="dashboard" className="rounded-lg">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="rounded-lg">
                      <UsersIcon className="h-4 w-4 mr-2" />
                      Staff
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-lg">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="dashboard" className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{org.name}</h2>
                      <p className="text-muted-foreground">/{org.slug}</p>
                    </div>

                    <VenueKPICards
                      avgRating={orgStats.avgRating}
                      totalTips={orgStats.totalTips}
                      totalReviews={orgStats.reviewCount}
                      currency={org.currency || "USD"}
                    />

                    <StaffLeaderboard staff={staff} currency={org.currency || "USD"} />

                    <Card className="glass-panel border-none bg-accent/10">
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                        <CardDescription>Grow your business</CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Button variant="outline" className="rounded-full justify-start">
                          Generate QR Codes
                        </Button>
                        <Button variant="outline" className="rounded-full justify-start">
                          Export Analytics
                        </Button>
                        <Button variant="outline" className="rounded-full justify-start">
                          View All Reviews
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="staff" className="space-y-6">
                    <StaffManagement
                      staff={staff}
                      currency={org.currency || "USD"}
                      onAddStaff={() => {
                        toast({
                          title: "Coming soon",
                          description: "Staff invitation feature is under development",
                        });
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-6">
                    <VenueSettings
                      orgId={org.id}
                      orgName={org.name}
                      orgSlug={org.slug}
                      country={org.country}
                      onUpdate={(data) => handleUpdateVenue(org.id, data)}
                    />
                  </TabsContent>
                </Tabs>
              );
            })()}
          </>
        )}
      </main>
    </div>
  );
}
