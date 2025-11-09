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
  const { user, role, loading: authLoading, refreshRole } = useAuth();

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
    if (!authLoading && user) {
      // Get invitation token from localStorage
      const token = localStorage.getItem('pending_invitation_token');
      
      // If user has invitation token, redirect to /server to complete onboarding
      if (token) {
        navigate(`/server?invitation=${token}`);
        localStorage.setItem('invitation_auto_accept', 'true');
        return;
      }

      // Otherwise redirect based on role
      if (role) {
        if (role === "admin") navigate("/admin");
        else if (role === "owner" || role === "manager") navigate("/owner");
        else if (role === "server") navigate("/server");
      }
    }
  }, [user, role, authLoading, navigate]);

  const loadInvitationDetails = async (token: string) => {
    setLoadingInvitation(true);
    try {
      const { data, error } = await supabase.functions.invoke("resolve-invitation", {
        body: { token },
      });

      if (!error && data?.valid) {
        const invitedEmail = (data.email || "").toLowerCase();
        setEmail(invitedEmail);
        setInvitationOrgName(data.orgName || null);
        setIsSignUp(true);

        // If already logged in as a different user, sign out to avoid RLS mismatch later
        if (user?.email && user.email.toLowerCase() !== invitedEmail) {
          await supabase.auth.signOut();
          toast({
            title: "Please sign in with the invited email",
            description: `You're currently signed in as ${user.email}. Continue with ${invitedEmail}.`,
          });
        }
      } else {
        throw new Error("Invalid or expired");
      }
    } catch (error) {
      console.error("Error loading invitation details:", error);
      toast({
        variant: "destructive",
        title: "Invalid invitation",
        description: "This invitation link is invalid or has expired.",
      });
      localStorage.removeItem('pending_invitation_token');
      setInvitationToken(null);
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
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Signed in successfully",
        });

        // If there's a pending invitation, redirect to server onboarding immediately
        const token = localStorage.getItem('pending_invitation_token');
        if (token) {
          navigate(`/server?invitation=${token}`);
          localStorage.setItem('invitation_auto_accept', 'true');
          return;
        }

        // Refresh role in context and redirect to the correct workspace
        if (data?.user) {
          console.debug('[Auth] Sign in successful, refreshing role...');
          await refreshRole();
          
          const { data: roleData } = await supabase.rpc('get_user_role', {
            _user_id: data.user.id,
          });

          if (roleData === 'admin') navigate('/admin');
          else if (roleData === 'owner' || roleData === 'manager') navigate('/owner');
          else if (roleData === 'server') navigate('/server');
          else navigate('/signup');
        } else {
          navigate('/');
        }
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
