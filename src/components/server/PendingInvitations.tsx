import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle2, XCircle, Building2, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Invitation {
  id: string;
  org_id: string;
  email: string;
  display_name: string;
  status: string;
  expires_at: string;
  created_at: string;
  org: {
    name: string;
    slug: string;
  };
}

export function PendingInvitations({ onAccept }: { onAccept: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, [user]);

  const loadInvitations = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    console.debug('[PendingInvitations] Loading for email:', user.email.toLowerCase());
    
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select(`
          *,
          org:org_id (
            name,
            slug
          )
        `)
        .eq("email", user.email.toLowerCase())
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString());

      if (error) {
        console.error('[PendingInvitations] Error loading invitations:', error);
        toast({
          title: "Error",
          description: "Failed to load invitations",
          variant: "destructive",
        });
      } else {
        console.debug('[PendingInvitations] Loaded invitations:', data);
        setInvitations(data || []);
      }
    } catch (error: any) {
      console.error('[PendingInvitations] Exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitation: Invitation) => {
    if (!user) return;

    setProcessing(invitation.id);
    try {
      // Use edge function to accept invitation and create assignment (bypass RLS safely)
      const { data, error } = await supabase.functions.invoke('accept-invitation', {
        body: { invitationId: invitation.id },
      });

      if (error) throw error;
      if (!data?.success) throw new Error('Failed to accept invitation');

      toast({
        title: "Invitation accepted!",
        description: `You've joined ${invitation.org.name}. You can now receive tips and reviews.`,
      });

      // Reload invitations
      await loadInvitations();
      onAccept();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    setProcessing(invitationId);
    try {
      const { error } = await supabase
        .from("invitations")
        .update({ status: "declined" })
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Invitation declined",
        description: "You can always accept another invitation later.",
      });

      await loadInvitations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to decline invitation",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return null;
  if (invitations.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Pending Invitations</h2>
      </div>

      <div className="space-y-3">
        {invitations.map((invitation) => (
          <Card key={invitation.id} className="glass-panel p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="rounded-full bg-primary/10 p-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{invitation.org.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You've been invited to join this venue as a team member
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(invitation)}
                  disabled={processing === invitation.id}
                  className="rounded-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecline(invitation.id)}
                  disabled={processing === invitation.id}
                  className="rounded-full"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
