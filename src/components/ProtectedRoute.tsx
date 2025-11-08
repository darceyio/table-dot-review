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
        navigate("/auth");
      } else if (allowedRoles) {
        // Check if user has a pending invitation (special case for servers)
        const invitationToken = searchParams.get('invitation') || localStorage.getItem('pending_invitation_token');
        const isServerInvitation = allowedRoles.includes("server") && invitationToken;

        if (!role) {
          // Allow access to /server if they have an invitation token (they'll get role assigned there)
          if (!isServerInvitation) {
            // No role yet and no invitation: send to onboarding
            navigate("/signup");
          }
        } else if (!allowedRoles.includes(role)) {
          // Redirect based on role
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

  // Block access if: no user, OR (has role requirements AND has role AND role not allowed AND not server invitation)
  if (!user || (allowedRoles && role && !allowedRoles.includes(role) && !isServerInvitation)) {
    return null;
  }

  return <>{children}</>;
}
