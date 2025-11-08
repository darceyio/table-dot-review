import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Sparkles } from "lucide-react";

interface ContextCardProps {
  venueName: string;
  venueSlug: string;
  serverName: string;
  onStart: () => void;
}

export function ContextCard({ venueName, venueSlug, serverName, onStart }: ContextCardProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="glass-panel border-none max-w-md w-full">
        <CardContent className="pt-12 pb-8 px-8 space-y-8 text-center">
          {/* Venue Icon */}
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
          </div>

          {/* Venue Info */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">{venueName}</h1>
            <p className="text-lg text-muted-foreground">
              You're in the right place to shout out {serverName} 💙
            </p>
          </div>

          {/* Subtext */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>No account needed • Takes ~30 seconds</span>
          </div>

          {/* CTA */}
          <div className="space-y-3 pt-4">
            <Button 
              onClick={onStart}
              size="lg"
              className="w-full rounded-full h-14 text-lg font-semibold"
            >
              Start
            </Button>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Not now
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
