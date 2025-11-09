import { ReactNode, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.debug('[ProtectedRoute] No user, redirecting to /auth');
        navigate("/auth");
      } else if (allowedRoles) {
        // Check if user has a pending invitation (special case for servers)
        const invitationToken = searchParams.get('invitation') || localStorage.getItem('pending_invitation_token');
        const isServerInvitation = allowedRoles.includes("server") && invitationToken;

        if (!role) {
          // Allow access to /server if they have an invitation token (they'll get role assigned there)
          if (!isServerInvitation) {
            // No role yet and no invitation: WAIT (don't redirect)
            console.debug('[ProtectedRoute] Role resolving, waiting...');
          }
        } else if (!allowedRoles.includes(role)) {
          // Redirect based on role
          console.debug('[ProtectedRoute] Role mismatch, redirecting based on role:', role);
          if (role === "admin") navigate("/admin");
          else if (role === "owner" || role === "manager") navigate("/owner");
          else if (role === "server") navigate("/server");
          else navigate("/auth");
        }
      }
    }
  }, [user, role, loading, navigate, allowedRoles, searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if user has invitation token (special case for server onboarding)
  const invitationToken = searchParams.get('invitation') || localStorage.getItem('pending_invitation_token');
  const isServerInvitation = allowedRoles?.includes("server") && invitationToken;

  // Block access if no user
  if (!user) {
    return null;
  }

  // If allowedRoles are specified
  if (allowedRoles) {
    // If role hasn't resolved yet and there's no invitation, show spinner
    if (!role && !isServerInvitation) {
      console.debug('[ProtectedRoute] Waiting for role to resolve...');
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    // If role exists but not allowed (and not server invitation), block access
    if (role && !allowedRoles.includes(role) && !isServerInvitation) {
      return null;
    }
  }

  return <>{children}</>;
}
