import { X, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

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

interface VenueDetailPanelProps {
  venue: Venue;
  onClose: () => void;
}

export function VenueDetailPanel({ venue, onClose }: VenueDetailPanelProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const content = (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {venue.avg_rating_emoji && (
              <span className="text-5xl">{venue.avg_rating_emoji}</span>
            )}
            <div>
              <h2 className="text-2xl font-bold">{venue.name}</h2>
              {venue.category && (
                <span className="inline-block px-3 py-1 mt-1 text-xs font-medium rounded-full bg-accent text-accent-foreground capitalize">
                  {venue.category}
                </span>
              )}
            </div>
          </div>
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {venue.address && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
            <span className="text-sm">{venue.address}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-1">
          <div className="text-sm text-muted-foreground">Reviews</div>
          <div className="text-2xl font-bold">{venue.total_reviews}</div>
        </Card>

        {venue.avg_tip_percent && (
          <Card className="p-4 space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Avg Tip
            </div>
            <div className="text-2xl font-bold">{venue.avg_tip_percent.toFixed(1)}%</div>
          </Card>
        )}
      </div>

      <div className="p-4 rounded-xl bg-muted/50 space-y-2">
        <p className="text-sm font-medium">Want to leave a review?</p>
        <p className="text-xs text-muted-foreground">
          Scan the QR code at your table to share your experience
        </p>
      </div>

      <Button 
        onClick={() => {
          const identifier = venue.slug || venue.id;
          navigate(`/venue/${identifier}`);
        }}
        className="w-full rounded-full"
      >
        View Full Profile
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader>
            <DrawerTitle className="sr-only">{venue.name}</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div className="absolute top-4 right-4 w-96 z-10 animate-in slide-in-from-right duration-300">
      <Card className="p-6 glass-panel">
        {content}
      </Card>
    </div>
  );
}
