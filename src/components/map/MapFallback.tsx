import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Venue {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  category: string | null;
  avg_rating_emoji: string | null;
  total_reviews: number;
  avg_tip_percent: number | null;
}

interface MapFallbackProps {
  venues: Venue[];
}

export function MapFallback({ venues }: MapFallbackProps) {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen gradient-soft overflow-auto">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
            <MapPin className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Discover venues in<br />
            <span className="text-primary">Lisbon</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The most human way to review and reward experiences
          </p>
          
          {/* Mapbox Setup CTA */}
          <Card className="glass-panel max-w-2xl mx-auto p-6 border-primary/20">
            <div className="space-y-3">
              <p className="text-sm font-medium">Want to see the interactive map?</p>
              <p className="text-xs text-muted-foreground">
                Add your free Mapbox API token to enable the full map experience
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://mapbox.com", "_blank")}
                className="gap-2"
              >
                Get Free Mapbox Token
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Venues Grid */}
        {venues.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Featured Venues</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <Card
                  key={venue.id}
                  className="glass-panel p-6 space-y-4 hover:scale-105 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/venue/${venue.slug}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {venue.avg_rating_emoji && (
                          <span className="text-4xl">{venue.avg_rating_emoji}</span>
                        )}
                        <div>
                          <h3 className="font-semibold text-lg">{venue.name}</h3>
                          {venue.category && (
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-accent text-accent-foreground capitalize">
                              {venue.category}
                            </span>
                          )}
                        </div>
                      </div>
                      {venue.address && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{venue.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Reviews: </span>
                      <span className="font-semibold">{venue.total_reviews}</span>
                    </div>
                    {venue.avg_tip_percent && (
                      <div>
                        <span className="text-muted-foreground">Avg Tip: </span>
                        <span className="font-semibold">{venue.avg_tip_percent.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="glass-panel p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl">🏙️</div>
              <h3 className="text-xl font-semibold">No venues yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Venues will appear here once restaurant owners add their locations with coordinates
              </p>
              <Button onClick={() => navigate("/signup")}>
                List Your Venue
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
