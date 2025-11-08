import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2 } from "lucide-react";

interface InviteServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  orgName: string;
  onSuccess: () => void;
}

export function InviteServerDialog({ open, onOpenChange, orgId, orgName, onSuccess }: InviteServerDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email || !displayName) {
      toast({
        title: "Missing information",
        description: "Please provide both email and display name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create invitation in database
      const { data: invitation, error: invError } = await supabase
        .from("invitations")
        .insert({
          org_id: orgId,
          email: email.toLowerCase(),
          display_name: displayName,
          invited_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (invError) throw invError;

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke("send-invitation", {
        body: {
          invitationId: invitation.id,
          email: email.toLowerCase(),
          displayName,
          orgName,
          origin: window.location.origin,
        },
      });

      if (emailError) {
        console.error("Email error:", emailError);
        toast({
          title: "Invitation created",
          description: "Invitation created but email failed to send. The server can still accept it from their dashboard.",
        });
      } else {
        toast({
          title: "Invitation sent!",
          description: `An email has been sent to ${email} with instructions to join your team.`,
        });
      }

      setEmail("");
      setDisplayName("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invite server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Server</DialogTitle>
          <DialogDescription>
            Add a new team member to {orgName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="server@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
            <p>They'll receive an email with instructions to join your team. If they don't have an account, they can sign up at /signup.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Invitation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
