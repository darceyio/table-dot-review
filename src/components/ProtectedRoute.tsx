import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (allowedRoles) {
        if (!role) {
          // No role yet: send to onboarding
          navigate("/signup");
        } else if (!allowedRoles.includes(role)) {
          // Redirect based on role
          if (role === "admin") navigate("/admin");
          else if (role === "owner" || role === "manager") navigate("/owner");
          else if (role === "server") navigate("/server");
          else navigate("/auth");
        }
      }
    }
  }, [user, role, loading, navigate, allowedRoles]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (allowedRoles && role && !allowedRoles.includes(role))) {
    return null;
  }

  return <>{children}</>;
}
