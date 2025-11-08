import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function InviteRedirect() {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      // Persist for post-auth routing
      localStorage.setItem('pending_invitation_token', token);
      navigate(`/auth?invitation=${token}`, { replace: true });
    } else {
      navigate('/auth', { replace: true });
    }
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
