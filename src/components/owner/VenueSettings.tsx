import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, MapPin, Upload, QrCode, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LocationPickerDialog } from "./LocationPickerDialog";
import { useNavigate } from "react-router-dom";

interface VenueSettingsProps {
  orgId: string;
  orgName: string;
  orgSlug: string;
  country: string | null;
  onUpdate: (data: { name: string; slug: string; country: string }) => Promise<void>;
}

export function VenueSettings({ orgId, orgName, orgSlug, country, onUpdate }: VenueSettingsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(orgName);
  const [slug, setSlug] = useState(orgSlug);
  const [countryValue, setCountryValue] = useState(country || "");
  const [loading, setLoading] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [location, setLocation] = useState<{
    id: string;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    slug: string | null;
  } | null>(null);

  useEffect(() => {
    loadLocation();
  }, [orgId]);

  const loadLocation = async () => {
    const { data } = await supabase
      .from("location")
      .select("id, latitude, longitude, address, slug")
      .eq("org_id", orgId)
      .maybeSingle();

    if (data) {
      setLocation(data);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate({ name, slug, country: countryValue });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSave = async (locationData: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    if (location) {
      // Update existing location
      const { error } = await supabase
        .from("location")
        .update({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address,
        })
        .eq("id", location.id);

      if (error) throw error;
    } else {
      // Create new location
      const { error } = await supabase.from("location").insert({
        org_id: orgId,
        name: name,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address,
      });

      if (error) throw error;
    }

    await loadLocation();
  };

  return (
    <Card className="glass-panel border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Venue Settings
        </CardTitle>
        <CardDescription>Manage your venue details and configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="venue-name">Venue Name</Label>
            <Input
              id="venue-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter venue name"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue-slug">URL Slug</Label>
            <Input
              id="venue-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="venue-slug"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue-country">Country</Label>
            <Input
              id="venue-country"
              value={countryValue}
              onChange={(e) => setCountryValue(e.target.value)}
              placeholder="e.g., United States"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Venue Logo</p>
            <p className="text-sm text-muted-foreground">Square format recommended (500x500px)</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full">
            Upload
          </Button>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
          <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
            <MapPin className="h-6 w-6 text-secondary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Location on Map</p>
            <p className="text-sm text-muted-foreground">
              {location?.latitude && location?.longitude
                ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                : "Pin your venue on the map so customers can find you"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setLocationPickerOpen(true)}
          >
            {location?.latitude ? "Update" : "Set Location"}
          </Button>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <ExternalLink className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Public Venue Profile</p>
            <p className="text-sm text-muted-foreground">
              View your venue as customers see it
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="rounded-full"
            onClick={() => {
              if (location?.slug) {
                navigate(`/venue/${location.slug}`);
              } else {
                toast({
                  title: "Profile not available",
                  description: "Please set up your venue location first",
                  variant: "destructive",
                });
              }
            }}
          >
            View Profile
          </Button>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-accent">
          <div className="h-12 w-12 rounded-xl bg-accent-foreground/10 flex items-center justify-center">
            <QrCode className="h-6 w-6 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-accent-foreground">QR Code Posters</p>
            <p className="text-sm text-accent-foreground/70">Generate printable QR codes for tables</p>
          </div>
          <Button variant="secondary" size="sm" className="rounded-full">
            Generate
          </Button>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={loading} className="rounded-full px-8">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>

      <LocationPickerDialog
        open={locationPickerOpen}
        onOpenChange={setLocationPickerOpen}
        currentLocation={
          location?.latitude && location?.longitude
            ? {
                latitude: Number(location.latitude),
                longitude: Number(location.longitude),
                address: location.address || undefined,
              }
            : null
        }
        onSave={handleLocationSave}
      />
    </Card>
  );
}
