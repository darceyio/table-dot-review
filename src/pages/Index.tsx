import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { MapView } from "@/components/map/MapView";

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      // Redirect authenticated users to their dashboard
      if (role === "admin") navigate("/admin");
      else if (role === "owner" || role === "manager") navigate("/owner");
      else if (role === "server") navigate("/server");
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      {/* Floating Header */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3 glass-panel px-4 py-3 rounded-full">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xl">🍽️</span>
        </div>
        <h1 className="text-lg font-bold hidden sm:block">Table.Review</h1>
      </div>

      {/* Sign In Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button onClick={() => navigate("/auth/login")} className="rounded-full">
          Sign In
        </Button>
      </div>

      {/* Mapbox Map */}
      <MapView />
    </div>
  );
};

export default Index;
