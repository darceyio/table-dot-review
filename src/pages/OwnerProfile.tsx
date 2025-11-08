import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Mail, Building2, Shield, Bell, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { EditProfileDialog } from "@/components/owner/EditProfileDialog";

export default function OwnerProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState<{
    displayName?: string;
    avatarUrl?: string;
  }>({});
  const [orgName, setOrgName] = useState<string>();

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("app_user")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfileData({
        displayName: data.display_name || undefined,
        avatarUrl: data.avatar_url || undefined,
      });
    }

    // Load org name
    const { data: orgData } = await supabase
      .from("org")
      .select("name")
      .eq("owner_user_id", user.id)
      .limit(1)
      .single();

    if (orgData) {
      setOrgName(orgData.name);
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen gradient-soft pb-6">
      {/* Header */}
      <header className="glass-panel border-none sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/owner")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base font-bold">Profile</h1>
              <p className="text-xs text-muted-foreground">Manage your account</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="glass-panel border-none">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-20 w-20 border-4 border-primary/10">
                  <AvatarImage src={profileData.avatarUrl} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {getInitials(user?.email || "U")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">
                    {profileData.displayName || user?.email?.split("@")[0]}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  {orgName && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {orgName}
                    </p>
                  )}
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full rounded-full"
                onClick={() => setEditDialogOpen(true)}
              >
                Edit Profile
              </Button>

              <EditProfileDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                currentDisplayName={profileData.displayName}
                currentAvatarUrl={profileData.avatarUrl}
                onSuccess={loadProfile}
              />
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card className="glass-panel border-none">
            <CardHeader>
              <CardTitle className="text-lg">Account Details</CardTitle>
              <CardDescription>Your business information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground">Business Owner</p>
                </div>
              </div>

              {orgName && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Organization</p>
                    <p className="text-sm text-muted-foreground">{orgName}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="glass-panel border-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                <div>
                  <p className="text-sm font-medium">Email Alerts</p>
                  <p className="text-xs text-muted-foreground">Get notified about new reviews</p>
                </div>
                <div className="h-6 w-11 bg-primary rounded-full flex items-center px-1">
                  <div className="h-5 w-5 bg-white rounded-full ml-auto shadow-sm" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                <div>
                  <p className="text-sm font-medium">Negative Review Alerts</p>
                  <p className="text-xs text-muted-foreground">Instant notification for low ratings</p>
                </div>
                <div className="h-6 w-11 bg-primary rounded-full flex items-center px-1">
                  <div className="h-5 w-5 bg-white rounded-full ml-auto shadow-sm" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                <div>
                  <p className="text-sm font-medium">Weekly Summary</p>
                  <p className="text-xs text-muted-foreground">Performance digest every Monday</p>
                </div>
                <div className="h-6 w-11 bg-muted rounded-full flex items-center px-1">
                  <div className="h-5 w-5 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="glass-panel border-none border-destructive/20">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Sign Out</CardTitle>
              <CardDescription>Leave your account on this device</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={signOut} variant="destructive" className="w-full rounded-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
