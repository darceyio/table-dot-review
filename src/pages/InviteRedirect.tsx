import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function InviteRedirect() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processInvitation = async () => {
      if (!token) {
        navigate('/auth', { replace: true });
        return;
      }

      console.debug('[InviteRedirect] Processing token:', token);

      try {
        // Resolve the invitation to get the invited email
        const { data, error } = await supabase.functions.invoke('resolve-invitation', {
          body: { token }
        });

        console.debug('[InviteRedirect] Resolved invitation:', { data, error });

        if (error || !data?.valid) {
          toast({
            title: "Invalid Invitation",
            description: "This invitation is invalid or has expired.",
            variant: "destructive",
          });
          navigate('/auth', { replace: true });
          return;
        }

        const invitedEmail = data.email?.toLowerCase();
        
        // Check if user is signed in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          const currentEmail = session.user.email.toLowerCase();
          console.debug('[InviteRedirect] Email check:', { currentEmail, invitedEmail });
          
          if (currentEmail !== invitedEmail) {
            // Sign out if email doesn't match
            console.debug('[InviteRedirect] Email mismatch, signing out');
            await supabase.auth.signOut();
            toast({
              title: "Email Mismatch",
              description: `This invitation is for ${invitedEmail}. Please sign in with that email.`,
            });
          }
        }

        // Persist token and redirect to auth
        localStorage.setItem('pending_invitation_token', token);
        navigate(`/auth?invitation=${token}`, { replace: true });
      } catch (err) {
        console.error('[InviteRedirect] Error:', err);
        toast({
          title: "Error",
          description: "Failed to process invitation. Please try again.",
          variant: "destructive",
        });
        navigate('/auth', { replace: true });
      } finally {
        setIsProcessing(false);
      }
    };

    processInvitation();
  }, [token, navigate, toast]);

  if (!isProcessing) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
