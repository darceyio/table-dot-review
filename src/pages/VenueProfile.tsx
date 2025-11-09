import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, TrendingUp, Users, ArrowLeft, QrCode, DollarSign, Loader2 } from "lucide-react";
import { VenueImageGallery } from "@/components/venue/VenueImageGallery";
import { VenueImageUpload } from "@/components/venue/VenueImageUpload";
import { TopServersLeaderboard } from "@/components/venue/TopServersLeaderboard";
import { ReviewsList } from "@/components/venue/ReviewsList";

interface VenueData {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  category: string | null;
  cover_image_url: string | null;
  org_id: string;
  currency: string;
}

interface Metrics {
  avg_rating_emoji: string | null;
  total_reviews: number;
  avg_tip_percent: number | null;
  total_tips: number | null;
}

interface VenueImage {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

interface ServerStats {
  server_id: string;
  display_name: string;
  avatar_url: string | null;
  total_tips_cents: number;
  review_count: number;
  avg_sentiment: string;
}

interface Review {
  id: string;
  created_at: string;
  rating_emoji: string | null;
  sentiment: string;
  comment: string | null;
  tip_amount_cents: number | null;
  tip_currency: string | null;
}

export default function VenueProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [images, setImages] = useState<VenueImage[]>([]);
  const [serverStats, setServerStats] = useState<ServerStats[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadVenueData();
  }, [slug]);

  const loadVenueData = async () => {
    if (!slug) return;

    // Try to find by slug first, if that fails, try by ID
    let { data: venueData } = await supabase
      .from("location")
      .select("*, org!inner(currency, owner_user_id)")
      .eq("slug", slug)
      .maybeSingle();

    // If not found by slug, try by ID (for venues without slugs)
    if (!venueData) {
      const { data: venueById } = await supabase
        .from("location")
        .select("*, org!inner(currency, owner_user_id)")
        .eq("id", slug)
        .maybeSingle();
      
      venueData = venueById;
    }

    if (!venueData) {
      setLoading(false);
      return;
    }

    const venue: VenueData = {
      id: venueData.id,
      name: venueData.name,
      slug: venueData.slug,
      address: venueData.address,
      category: venueData.category,
      cover_image_url: venueData.cover_image_url,
      org_id: venueData.org_id,
      currency: (venueData.org as any).currency || 'EUR',
    };

    setVenue(venue);

    // Check if current user is owner
    if (user && (venueData.org as any).owner_user_id === user.id) {
      setIsOwner(true);
    }

    // Load metrics
    const { data: metricsData } = await supabase
      .from("venue_metrics_cache")
      .select("*")
      .eq("venue_id", venueData.id)
      .maybeSingle();

    setMetrics(metricsData);

    // Load venue images
    const { data: imagesData } = await supabase
      .from("venue_images")
      .select("*")
      .eq("venue_id", venueData.id)
      .order("display_order");

    if (imagesData) {
      setImages(imagesData);
    }

    // Load server stats with tips and reviews
    const { data: serverStatsData } = await supabase
      .from("server_assignment")
      .select(`
        server_id,
        app_user!inner(display_name, avatar_url),
        review!inner(sentiment),
        tip!inner(amount_cents, status)
      `)
      .eq("location_id", venueData.id)
      .eq("is_active", true);

    if (serverStatsData) {
      const stats: ServerStats[] = serverStatsData.map((s: any) => {
        const completedTips = (s.tip || []).filter((t: any) => t.status === 'completed');
        const totalTips = completedTips.reduce((sum: number, t: any) => sum + (t.amount_cents || 0), 0);
        
        const reviews = s.review || [];
        const sentimentCounts = reviews.reduce((acc: any, r: any) => {
          acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
          return acc;
        }, {});
        
        const avgSentiment = Object.entries(sentimentCounts).sort(([, a]: any, [, b]: any) => b - a)[0]?.[0] || 'neutral';

        return {
          server_id: s.server_id,
          display_name: s.app_user.display_name,
          avatar_url: s.app_user.avatar_url,
          total_tips_cents: totalTips,
          review_count: reviews.length,
          avg_sentiment: avgSentiment,
        };
      });

      setServerStats(stats);
    }

    // Fetch individual reviews (by location_id or org_id)
    const { data: reviewsData } = await supabase
      .from("review")
      .select(`
        id,
        created_at,
        rating_emoji,
        sentiment,
        comment,
        linked_tip_id,
        location_id,
        org_id
      `)
      .or(`location_id.eq.${venueData.id},and(location_id.is.null,org_id.eq.${venueData.org_id})`)
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch associated tips for reviews that have them
    const tipIds = reviewsData
      ?.filter((r: any) => r.linked_tip_id)
      .map((r: any) => r.linked_tip_id) || [];

    const { data: reviewTips } = tipIds.length > 0
      ? await supabase
          .from("tip")
          .select("id, amount_cents, currency")
          .in("id", tipIds)
      : { data: [] };

    const tipMap = new Map(reviewTips?.map((t: any) => [t.id, t] as [string, any]) || []);

    const formattedReviews: Review[] = reviewsData?.map((review: any) => {
      const tip = review.linked_tip_id ? tipMap.get(review.linked_tip_id) : null;
      return {
        id: review.id,
        created_at: review.created_at,
        rating_emoji: review.rating_emoji,
        sentiment: review.sentiment,
        comment: review.comment,
        tip_amount_cents: (tip as any)?.amount_cents || null,
        tip_currency: (tip as any)?.currency || null,
      };
    }) || [];

    setReviews(formattedReviews);

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

        {/* Photo Gallery */}
        {(images.length > 0 || venue.cover_image_url) && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Photos</h2>
            <VenueImageGallery images={images} coverImage={venue.cover_image_url} />
          </div>
        )}

        {/* Owner Upload Section */}
        {isOwner && (
          <VenueImageUpload venueId={venue.id} onUploadComplete={() => loadVenueData()} />
        )}

        {/* Top Servers Leaderboard */}
        {serverStats.length > 0 && (
          <TopServersLeaderboard servers={serverStats} currency={venue.currency} />
        )}

        {/* Reviews Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-foreground">
              What Customers Are Saying
            </h2>
            <span className="text-2xl">💬</span>
          </div>
          <ReviewsList reviews={reviews} />
        </section>

        {/* Tip Statistics */}
        {serverStats.length > 0 && (
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Tip Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {serverStats.reduce((sum, s) => sum + s.total_tips_cents, 0) / 100}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Total Tips ({venue.currency})</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {(serverStats.reduce((sum, s) => sum + s.total_tips_cents, 0) / serverStats.reduce((sum, s) => sum + s.review_count, 1) / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Avg per Review</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {serverStats.reduce((sum, s) => sum + s.review_count, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Total Reviews</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {serverStats.length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Active Servers</p>
                </div>
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
