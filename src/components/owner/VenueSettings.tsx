import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, MapPin, Upload, QrCode } from "lucide-react";
import { useState } from "react";

interface VenueSettingsProps {
  orgId: string;
  orgName: string;
  orgSlug: string;
  country: string | null;
  onUpdate: (data: { name: string; slug: string; country: string }) => Promise<void>;
}

export function VenueSettings({ orgName, orgSlug, country, onUpdate }: VenueSettingsProps) {
  const [name, setName] = useState(orgName);
  const [slug, setSlug] = useState(orgSlug);
  const [countryValue, setCountryValue] = useState(country || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate({ name, slug, country: countryValue });
    } finally {
      setLoading(false);
    }
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
            <p className="text-sm text-muted-foreground">Pin your venue on Google Maps</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full">
            Set Location
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
    </Card>
  );
}
