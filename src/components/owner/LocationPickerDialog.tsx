import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZGFyY2V5YmVhdSIsImEiOiJjazgwcDI2bmswMjBrM2pudGVpN3VmZHAyIn0.h8fIiH2aUjxYoNcrI1v1gQ";

interface LocationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  onSave: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => Promise<void>;
}

export function LocationPickerDialog({
  open,
  onOpenChange,
  currentLocation,
  onSave,
}: LocationPickerDialogProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { toast } = useToast();

  const [selectedLat, setSelectedLat] = useState<number>(
    currentLocation?.latitude || 38.7169
  );
  const [selectedLng, setSelectedLng] = useState<number>(
    currentLocation?.longitude || -9.1399
  );
  const [address, setAddress] = useState<string>(
    currentLocation?.address || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [selectedLng, selectedLat],
      zoom: 14,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add initial marker
    marker.current = new mapboxgl.Marker({ draggable: true, color: "#3b82f6" })
      .setLngLat([selectedLng, selectedLat])
      .addTo(map.current);

    // Update coordinates when marker is dragged
    marker.current.on("dragend", () => {
      const lngLat = marker.current!.getLngLat();
      setSelectedLat(lngLat.lat);
      setSelectedLng(lngLat.lng);
      reverseGeocode(lngLat.lat, lngLat.lng);
    });

    // Click to place marker
    map.current.on("click", (e) => {
      const { lat, lng } = e.lngLat;
      setSelectedLat(lat);
      setSelectedLng(lng);
      marker.current?.setLngLat([lng, lat]);
      reverseGeocode(lat, lng);
    });

    return () => {
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [open]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setSelectedLat(lat);
        setSelectedLng(lng);
        setAddress(data.features[0].place_name);

        map.current?.flyTo({
          center: [lng, lat],
          zoom: 15,
        });

        marker.current?.setLngLat([lng, lat]);
      } else {
        toast({
          title: "Location not found",
          description: "Try a different search query",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Unable to search for location",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave({
        latitude: selectedLat,
        longitude: selectedLng,
        address,
      });
      toast({
        title: "Location saved",
        description: "Your venue location has been updated",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save location",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Set Venue Location
          </DialogTitle>
          <DialogDescription>
            Click or drag the pin on the map to set your venue's exact location
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for an address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 rounded-full"
              />
            </div>
            <Button onClick={handleSearch} className="rounded-full">
              Search
            </Button>
          </div>

          {/* Map Container */}
          <div
            ref={mapContainer}
            className="w-full h-[400px] rounded-xl overflow-hidden border-2 border-border"
          />

          {/* Coordinates Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input
                value={selectedLat.toFixed(6)}
                readOnly
                className="rounded-xl bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input
                value={selectedLng.toFixed(6)}
                readOnly
                className="rounded-xl bg-muted"
              />
            </div>
          </div>

          {/* Address Display */}
          {address && (
            <div className="space-y-2">
              <Label>Detected Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-xl"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="rounded-full"
          >
            {loading ? "Saving..." : "Save Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
