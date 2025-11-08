import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Building2, QrCode, UserPlus } from "lucide-react";
import { VenueKPICards } from "@/components/owner/VenueKPICards";
import { StaffLeaderboard } from "@/components/owner/StaffLeaderboard";
import { StaffManagement } from "@/components/owner/StaffManagement";
import { QRGenerator } from "@/components/owner/QRGenerator";
import { VenueSettings } from "@/components/owner/VenueSettings";
import { AnalyticsView } from "@/components/owner/AnalyticsView";
import { ProfileView } from "@/components/owner/ProfileView";
import { BottomNav } from "@/components/owner/BottomNav";
import { EmptyState } from "@/components/owner/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { InviteServerDialog } from "@/components/owner/InviteServerDialog";
import { CreateOrgDialog } from "@/components/owner/CreateOrgDialog";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [staffData, setStaffData] = useState<Record<string, StaffMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [ownerAvatar, setOwnerAvatar] = useState<string | null>(null);
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load owner avatar
    const { data: userData } = await supabase
      .from("app_user")
      .select("avatar_url")
      .eq("id", user.id)
      .single();
    
    if (userData) {
      setOwnerAvatar(userData.avatar_url);
    }

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

  const currentOrg = orgs.find((o) => o.id === selectedOrg);
  const currentStats = selectedOrg ? stats[selectedOrg] : null;
  const currentStaff = selectedOrg ? staffData[selectedOrg] || [] : [];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (orgs.length === 0) {
      return (
        <>
          <EmptyState
            icon={Building2}
            title="No venues yet"
            description="Create your first venue to start receiving reviews and tips from customers"
            actionLabel="Create Venue"
            onAction={() => setCreateOrgDialogOpen(true)}
          />
          <CreateOrgDialog
            open={createOrgDialogOpen}
            onOpenChange={setCreateOrgDialogOpen}
            onSuccess={loadData}
          />
        </>
      );
    }

    if (!currentOrg || !currentStats) return null;

    switch (activeTab) {
      case "home":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">{currentOrg.name}</h2>
              <p className="text-sm text-muted-foreground">/{currentOrg.slug}</p>
            </div>

            <VenueKPICards
              avgRating={currentStats.avgRating}
              totalTips={currentStats.totalTips}
              totalReviews={currentStats.reviewCount}
              currency={currentOrg.currency || "USD"}
            />

            <StaffLeaderboard staff={currentStaff} currency={currentOrg.currency || "USD"} />

            {currentStaff.length === 0 && (
              <EmptyState
                icon={UserPlus}
                title="No staff yet"
                description="Add your first staff member to start receiving tips and reviews. Make sure they're using their QR codes!"
                actionLabel="Add Staff Member"
                onAction={() => setActiveTab("staff")}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={() => setActiveTab("venues")}
                variant="outline"
                className="rounded-full justify-start h-auto py-4"
              >
                <QrCode className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Generate QR Codes</div>
                  <div className="text-xs text-muted-foreground">Create table and server QRs</div>
                </div>
              </Button>

              <Button
                onClick={() => setActiveTab("analytics")}
                variant="outline"
                className="rounded-full justify-start h-auto py-4"
              >
                <Building2 className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">View Analytics</div>
                  <div className="text-xs text-muted-foreground">Performance insights</div>
                </div>
              </Button>
            </div>
          </div>
        );

      case "venues":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Venue Management</h2>
              <p className="text-muted-foreground">Configure your venue settings and QR codes</p>
            </div>
            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-full">
                <TabsTrigger value="settings" className="rounded-full">Settings</TabsTrigger>
                <TabsTrigger value="qr" className="rounded-full">QR Codes</TabsTrigger>
              </TabsList>
              <TabsContent value="settings" className="mt-6">
                <VenueSettings
                  orgId={currentOrg.id}
                  orgName={currentOrg.name}
                  orgSlug={currentOrg.slug}
                  country={currentOrg.country}
                  onUpdate={async (data) => {
                    const { error } = await supabase
                      .from("org")
                      .update(data)
                      .eq("id", currentOrg.id);
                    
                    if (error) {
                      toast({
                        title: "Error",
                        description: "Failed to update venue settings",
                        variant: "destructive",
                      });
                    } else {
                      toast({
                        title: "Success",
                        description: "Venue settings updated successfully",
                      });
                      loadData();
                    }
                  }}
                />
              </TabsContent>
              <TabsContent value="qr" className="mt-6">
                <QRGenerator
                  orgId={currentOrg.id}
                  orgName={currentOrg.name}
                  staff={currentStaff.map((s) => ({ id: s.id, displayName: s.displayName }))}
                />
              </TabsContent>
            </Tabs>
          </div>
        );

      case "staff":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Staff Management</h2>
              <p className="text-muted-foreground">Manage your team at {currentOrg.name}</p>
            </div>
            <StaffManagement
              staff={currentStaff}
              currency={currentOrg.currency || "USD"}
              onAddStaff={() => setInviteDialogOpen(true)}
            />
            <InviteServerDialog
              open={inviteDialogOpen}
              onOpenChange={setInviteDialogOpen}
              orgId={currentOrg.id}
              orgName={currentOrg.name}
              onSuccess={loadData}
            />
          </div>
        );

      case "analytics":
        return (
          <AnalyticsView
            orgName={currentOrg.name}
            stats={{
              totalTips: currentStats.totalTips,
              totalReviews: currentStats.reviewCount,
              avgRating: currentStats.avgRating,
            }}
            currency={currentOrg.currency || "USD"}
          />
        );

      case "profile":
        return <ProfileView orgName={currentOrg.name} onProfileUpdate={loadData} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen gradient-soft pb-20 md:pb-6">
      {/* Header - Desktop & Mobile */}
      <header className="glass-panel border-none sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar 
                className="h-10 w-10 border-2 border-primary/10 cursor-pointer hover:border-primary/30 transition-colors" 
                onClick={() => setActiveTab("profile")}
              >
                <AvatarImage src={ownerAvatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {user?.email?.substring(0, 2).toUpperCase() || "TR"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-base font-bold">Table.Review</h1>
                <p className="text-xs text-muted-foreground">Business Owner</p>
              </div>
            </div>

            {/* Venue Selector - Only show if multiple venues */}
            {orgs.length > 1 && !loading && (
              <div className="hidden md:flex gap-2">
                {orgs.map((org) => (
                  <Button
                    key={org.id}
                    variant={selectedOrg === org.id ? "default" : "outline"}
                    onClick={() => setSelectedOrg(org.id)}
                    size="sm"
                    className="rounded-full"
                  >
                    {org.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Venue Selector */}
          {orgs.length > 1 && !loading && (
            <div className="md:hidden mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {orgs.map((org) => (
                <Button
                  key={org.id}
                  variant={selectedOrg === org.id ? "default" : "outline"}
                  onClick={() => setSelectedOrg(org.id)}
                  size="sm"
                  className="rounded-full whitespace-nowrap"
                >
                  {org.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {renderContent()}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
