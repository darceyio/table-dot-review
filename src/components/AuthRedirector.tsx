import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

function getWorkspacePath(role: string | null): string {
  if (!role) return "/signup";
  if (role === "admin") return "/admin";
  if (role === "owner" || role === "manager") return "/owner";
  if (role === "server") return "/server";
  return "/"; // customer or unknown
}

export default function AuthRedirector() {
  const { user, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Invitation redirect takes precedence
    const token = localStorage.getItem("pending_invitation_token");
    if (token && !location.pathname.startsWith("/server")) {
      localStorage.setItem("invitation_auto_accept", "true");
      navigate(`/server?invitation=${token}`, { replace: true });
      return;
    }

    // Only auto-redirect from onboarding/auth routes
    const path = location.pathname;
    const isAuthArea =
      path === "/" ||
      path.startsWith("/auth") ||
      path.startsWith("/signup");

    if (isAuthArea && role) {
      navigate(getWorkspacePath(role), { replace: true });
    }
  }, [user, role, location.pathname, navigate]);

  return null;
}
