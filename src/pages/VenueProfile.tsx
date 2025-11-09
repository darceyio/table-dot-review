import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, TrendingUp, Users, ArrowLeft, QrCode } from "lucide-react";
import { Loader2 } from "lucide-react";

interface VenueData {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  category: string | null;
  cover_image_url: string | null;
}

interface Metrics {
  avg_rating_emoji: string | null;
  total_reviews: number;
  avg_tip_percent: number | null;
  total_tips: number | null;
}

interface ServerInfo {
  server_id: string;
  display_name: string;
  avatar_url: string | null;
}

export default function VenueProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [servers, setServers] = useState<ServerInfo[]>([]);

  useEffect(() => {
    loadVenueData();
  }, [slug]);

  const loadVenueData = async () => {
    if (!slug) return;

    const { data: venueData } = await supabase
      .from("location")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!venueData) {
      setLoading(false);
      return;
    }

    setVenue(venueData);

    // Load metrics
    const { data: metricsData } = await supabase
      .from("venue_metrics_cache")
      .select("*")
      .eq("venue_id", venueData.id)
      .maybeSingle();

    setMetrics(metricsData);

    // Load servers
    const { data: assignments } = await supabase
      .from("server_assignment")
      .select(`
        server_id,
        app_user!inner(display_name, avatar_url)
      `)
      .eq("org_id", venueData.org_id)
      .eq("is_active", true);

    if (assignments) {
      const serverList = assignments.map((a: any) => ({
        server_id: a.server_id,
        display_name: a.app_user.display_name,
        avatar_url: a.app_user.avatar_url,
      }));
      setServers(serverList);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Venue not found</h2>
          <Button onClick={() => navigate("/")}>Return to Map</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-soft pb-20">
      {/* Header */}
      <header className="glass-panel border-none sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Map
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Hero Section */}
        <div className="glass-panel p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-4">
                {metrics?.avg_rating_emoji && (
                  <span className="text-6xl">{metrics.avg_rating_emoji}</span>
                )}
                <div>
                  <h1 className="text-4xl font-bold">{venue.name}</h1>
                  {venue.category && (
                    <span className="inline-block px-4 py-1 mt-2 text-sm font-medium rounded-full bg-accent text-accent-foreground capitalize">
                      {venue.category}
                    </span>
                  )}
                </div>
              </div>

              {venue.address && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>{venue.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics?.total_reviews || 0}</div>
            </CardContent>
          </Card>

          {metrics?.avg_tip_percent && (
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Average Tip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.avg_tip_percent.toFixed(1)}%</div>
              </CardContent>
            </Card>
          )}

          {metrics?.total_tips && (
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">€{Number(metrics.total_tips).toFixed(0)}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Server Highlight */}
        {servers.length > 0 && (
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Our Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {servers.map((server) => (
                  <div key={server.server_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={server.avatar_url || undefined} />
                      <AvatarFallback>{server.display_name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{server.display_name}</div>
                      <div className="text-xs text-muted-foreground">Server</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR CTA */}
        <Card className="glass-panel bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center space-y-4">
            <QrCode className="h-16 w-16 mx-auto text-primary" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Want to leave a review?</h3>
              <p className="text-muted-foreground">
                You can only leave a review by scanning the QR code at your table
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
