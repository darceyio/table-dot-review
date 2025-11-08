import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitationOrgName, setInvitationOrgName] = useState<string | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role, loading: authLoading } = useAuth();

  useEffect(() => {
    // Check for invitation token
    const token = searchParams.get('invitation') || localStorage.getItem('pending_invitation_token');
    if (token) {
      setInvitationToken(token);
      localStorage.setItem('pending_invitation_token', token);
      loadInvitationDetails(token);
    } else {
      setLoadingInvitation(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && user && role) {
      // Get invitation token from localStorage
      const token = localStorage.getItem('pending_invitation_token');
      
      // Redirect based on role, preserving invitation token
      if (role === "admin") navigate("/admin");
      else if (role === "owner" || role === "manager") navigate("/owner");
      else if (role === "server") {
        navigate(token ? `/server?invitation=${token}` : "/server");
        if (token) {
          localStorage.setItem('invitation_auto_accept', 'true');
        }
      }
    }
  }, [user, role, authLoading, navigate]);

  const loadInvitationDetails = async (token: string) => {
    setLoadingInvitation(true);
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("email, org:org_id(name)")
        .eq("token", token)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!error && data) {
        setEmail(data.email);
        setInvitationOrgName(data.org?.name || null);
        setIsSignUp(true); // Default to sign up for new invitations
      } else {
        toast({
          variant: "destructive",
          title: "Invalid invitation",
          description: "This invitation link is invalid or has expired.",
        });
        localStorage.removeItem('pending_invitation_token');
        setInvitationToken(null);
      }
    } catch (error) {
      console.error("Error loading invitation details:", error);
      toast({
        variant: "destructive",
        title: "Error loading invitation",
        description: "Could not load invitation details.",
      });
    } finally {
      setLoadingInvitation(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const redirectUrl = invitationToken 
          ? `${window.location.origin}/auth/verify-email?invitation=${invitationToken}`
          : `${window.location.origin}/auth/verify-email`;

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: email.split('@')[0]
            }
          },
        });

        if (error) throw error;

        // Navigate to verify-email page with context
        navigate(invitationToken 
          ? `/auth/verify-email?invitation=${invitationToken}&email=${encodeURIComponent(email)}`
          : `/auth/verify-email?email=${encodeURIComponent(email)}`
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Signed in successfully",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingInvitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Table Review</CardTitle>
          <CardDescription>
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        {invitationOrgName && (
          <div className="px-6 pb-4">
            <div className="glass-panel p-4 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">You're invited to join</p>
                  <p className="text-lg font-semibold">{invitationOrgName}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
