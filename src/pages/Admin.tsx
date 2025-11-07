import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, Users, Building2 } from "lucide-react";

interface Org {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  currency: string | null;
  created_at: string;
}

export default function Admin() {
  const { user, role, signOut } = useAuth();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrgs();
  }, []);

  const loadOrgs = async () => {
    const { data, error } = await supabase
      .from("org")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrgs(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current User
            </CardTitle>
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">User ID:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">{user?.id}</code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>
              All organizations in the platform ({orgs.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : orgs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No organizations yet. Create one to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {orgs.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between border border-border rounded-lg p-4"
                  >
                    <div>
                      <h3 className="font-semibold">{org.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        /{org.slug} • {org.country || "No country"} • {org.currency}
                      </p>
                    </div>
                    <Badge variant="outline">{new Date(org.created_at).toLocaleDateString()}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-accent bg-accent/5">
          <CardHeader>
            <CardTitle className="text-sm">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>• Create owner users and assign them to organizations</p>
            <p>• Set up server profiles and assignments</p>
            <p>• Generate QR codes for server assignments</p>
            <p>• Implement Stripe/crypto payment Edge Functions</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
