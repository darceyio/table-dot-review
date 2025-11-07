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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <QrCode className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Table Review</h1>
          </div>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            QR-Based Tipping + Reviews for Hospitality
          </h2>
          <p className="text-xl text-muted-foreground">
            Empower servers with portable reputation. Give venues live performance insights. Enable
            seamless tips and feedback.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="mt-4">
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <QrCode className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Scan & Connect</CardTitle>
              <CardDescription>
                Guests scan a QR code linked to their server, creating instant connection
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <DollarSign className="h-10 w-10 text-success mb-2" />
              <CardTitle>Tip Directly</CardTitle>
              <CardDescription>
                Leave tips via Stripe, cash tracking, or crypto. Servers keep portable earnings
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-accent-foreground mb-2" />
              <CardTitle>Leave Reviews</CardTitle>
              <CardDescription>
                Provide real-time feedback that helps servers improve and venues respond
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <Card className="border-accent bg-accent/5">
            <CardHeader>
              <CardTitle>Platform Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>✅ Database schema with role-based access control</p>
              <p>✅ Admin, Owner, and Server dashboards</p>
              <p>✅ QR code resolution for public access</p>
              <p>🔧 Coming: Stripe/crypto payment Edge Functions</p>
              <p>🔧 Coming: Real-time tip and review submission</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
