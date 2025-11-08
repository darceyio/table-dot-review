import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Building2, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [invitationOrgName, setInvitationOrgName] = useState<string | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(false);
  
  const email = searchParams.get('email');
  const invitationToken = searchParams.get('invitation');

  useEffect(() => {
    // If user is already authenticated and email is verified, redirect
    if (!authLoading && user && role) {
      const token = invitationToken || localStorage.getItem('pending_invitation_token');
      if (role === "admin") navigate("/admin");
      else if (role === "owner" || role === "manager") navigate("/owner");
      else if (role === "server") {
        navigate(token ? `/server?invitation=${token}` : "/server");
        if (token) {
          localStorage.setItem('invitation_auto_accept', 'true');
        }
      }
    }
  }, [user, role, authLoading, navigate, invitationToken]);

  useEffect(() => {
    // Load invitation details if token is present
    if (invitationToken) {
      localStorage.setItem('pending_invitation_token', invitationToken);
      loadInvitationDetails(invitationToken);
    }
  }, [invitationToken]);

  const loadInvitationDetails = async (token: string) => {
    setLoadingInvitation(true);
    try {
      const { data } = await supabase.functions.invoke("resolve-invitation", {
        body: { token },
      });

      if (data?.valid) {
        setInvitationOrgName(data.orgName || null);
      }
    } catch (error) {
      console.error("Error loading invitation details:", error);
    } finally {
      setLoadingInvitation(false);
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
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We've sent a verification link to{" "}
            {email && <span className="font-semibold text-foreground">{email}</span>}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {invitationOrgName && (
            <div className="glass-panel rounded-xl border border-primary/20 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    You're joining
                  </p>
                  <p className="text-lg font-semibold">{invitationOrgName}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-lg bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">What's next?</p>
                <p className="text-sm text-muted-foreground">
                  Click the verification link in your email to confirm your account
                  {invitationOrgName && ` and join ${invitationOrgName}`}.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">Can't find the email?</p>
                <p className="text-sm text-muted-foreground">
                  Check your spam folder, or wait a few minutes for it to arrive.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="text-sm"
            >
              Back to sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
