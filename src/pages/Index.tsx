import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, DollarSign, MessageSquare, Building2, Loader2 } from "lucide-react";

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
    <div className="min-h-screen gradient-soft">
      <header className="glass-panel border-none sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Table.Review</h1>
          </div>
          <Button onClick={() => navigate("/auth/login")} className="rounded-full">Sign In</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              The most human way to<br />
              <span className="text-primary">review and reward</span> experiences
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Portable reputation for servers. Live insights for venues. Seamless tips and heartfelt feedback.
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={() => navigate("/signup")} 
            className="rounded-full px-8 h-12 text-lg"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <div className="glass-panel p-8 space-y-4 hover:scale-105 transition-transform">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Scan & Connect</h3>
            <p className="text-muted-foreground">
              Guests scan a QR code linked to their server, creating instant connection
            </p>
          </div>

          <div className="glass-panel p-8 space-y-4 hover:scale-105 transition-transform">
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold">Tip Directly</h3>
            <p className="text-muted-foreground">
              Leave tips via crypto instantly. Servers keep portable earnings across venues
            </p>
          </div>

          <div className="glass-panel p-8 space-y-4 hover:scale-105 transition-transform">
            <div className="h-12 w-12 rounded-full bg-accent-foreground/10 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Leave Reviews</h3>
            <p className="text-muted-foreground">
              Provide real-time feedback that helps servers improve and venues respond
            </p>
          </div>
        </div>

        {/* Platform Status */}
        <div className="max-w-3xl mx-auto">
          <div className="glass-panel p-8 bg-accent/5">
            <h3 className="text-lg font-semibold mb-4">Platform Status</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-success mt-1.5" />
                <span>Role-based access control</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-success mt-1.5" />
                <span>Server & Owner dashboards</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-success mt-1.5" />
                <span>Crypto tipping (ETH, Base, Polygon)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-success mt-1.5" />
                <span>QR code scanning</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
