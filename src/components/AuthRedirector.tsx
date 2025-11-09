import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

function getWorkspacePath(role: string | null): string {
  if (!role) return "/signup";
  if (role === "admin") return "/admin";
  if (role === "owner" || role === "manager") return "/owner";
  if (role === "server") return "/server";
  return "/"; // customer or unknown
}

export default function AuthRedirector() {
  const { user, role, refreshRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (!user || finalizing) return;

    const finalizePendingSignup = async () => {
      const pendingServer = localStorage.getItem("pending_server_signup");
      const pendingOwner = localStorage.getItem("pending_owner_signup");

      if (pendingServer && !role) {
        setFinalizing(true);
        try {
          const payload = JSON.parse(pendingServer);
          const { data, error } = await supabase.functions.invoke("finalize-server-signup", {
            body: payload
          });

          if (error) throw error;

          localStorage.removeItem("pending_server_signup");
          console.debug('[AuthRedirector] Server signup finalized, refreshing role...');
          await refreshRole();
          navigate("/server", { replace: true });
        } catch (error) {
          console.error("Failed to finalize server signup:", error);
        } finally {
          setFinalizing(false);
        }
        return;
      }

      if (pendingOwner && !role) {
        setFinalizing(true);
        try {
          const payload = JSON.parse(pendingOwner);
          const { data, error } = await supabase.functions.invoke("finalize-owner-signup", {
            body: payload
          });

          if (error) throw error;

          localStorage.removeItem("pending_owner_signup");
          console.debug('[AuthRedirector] Owner signup finalized, refreshing role...');
          await refreshRole();
          navigate("/owner", { replace: true });
        } catch (error) {
          console.error("Failed to finalize owner signup:", error);
        } finally {
          setFinalizing(false);
        }
        return;
      }
    };

    finalizePendingSignup();

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
  }, [user, role, location.pathname, navigate, finalizing]);

  return null;
}
