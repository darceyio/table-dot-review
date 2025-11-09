import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { VenueMarker } from "./VenueMarker";
import { VenueDetailPanel } from "./VenueDetailPanel";
import { FilterBar } from "./FilterBar";
import { MapFallback } from "./MapFallback";

// Set your Mapbox token here - get one free at https://mapbox.com
const MAPBOX_TOKEN = "pk.eyJ1IjoidGFibGVyZXZpZXciLCJhIjoiY20yZXh5YzQ3MDFvNTJrcXpsYTRiZ3JpZCJ9.placeholder";
const isValidToken = MAPBOX_TOKEN && !MAPBOX_TOKEN.includes("placeholder");

if (isValidToken) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

interface Venue {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  avg_rating_emoji: string | null;
  total_reviews: number;
  avg_tip_percent: number | null;
}

interface Filters {
  sentiment: string | null;
  audience: string | null;
  category: string | null;
}

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [filters, setFilters] = useState<Filters>({
    sentiment: null,
    audience: null,
    category: null,
  });

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    if (!isValidToken || !mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-9.1399, 38.7169], // Lisbon
      zoom: 13,
      pitch: 0,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || venues.length === 0) return;

    // Clear existing markers
    const markers = document.querySelectorAll(".mapboxgl-marker");
    markers.forEach((marker) => marker.remove());

    // Add markers for filtered venues
    const filteredVenues = filterVenues(venues);
    filteredVenues.forEach((venue) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer";
      el.innerHTML = VenueMarker({ venue });
      
      el.addEventListener("click", () => {
        setSelectedVenue(venue);
        map.current?.flyTo({
          center: [venue.longitude, venue.latitude],
          zoom: 15,
        });
      });

      new mapboxgl.Marker({ element: el })
        .setLngLat([venue.longitude, venue.latitude])
        .addTo(map.current!);
    });
  }, [venues, filters]);

  const loadVenues = async () => {
    const { data: locations } = await supabase
      .from("location")
      .select("*")
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (!locations) return;

    const venueIds = locations.map((l) => l.id);
    const { data: metrics } = await supabase
      .from("venue_metrics_cache")
      .select("*")
      .in("venue_id", venueIds);

    const venuesWithMetrics = locations.map((loc) => {
      const metric = metrics?.find((m) => m.venue_id === loc.id);
      return {
        id: loc.id,
        name: loc.name,
        slug: loc.slug || loc.id,
        address: loc.address,
        category: loc.category,
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude),
        avg_rating_emoji: metric?.avg_rating_emoji || null,
        total_reviews: metric?.total_reviews || 0,
        avg_tip_percent: metric?.avg_tip_percent ? Number(metric.avg_tip_percent) : null,
      };
    });

    setVenues(venuesWithMetrics);
  };

  const filterVenues = (allVenues: Venue[]) => {
    return allVenues.filter((venue) => {
      if (filters.sentiment && venue.avg_rating_emoji !== filters.sentiment) {
        return false;
      }
      if (filters.category && venue.category !== filters.category) {
        return false;
      }
      return true;
    });
  };

  // Show fallback if no valid Mapbox token
  if (!isValidToken) {
    return <MapFallback venues={venues} />;
  }

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      
      <FilterBar filters={filters} onFilterChange={setFilters} />
      
      {selectedVenue && (
        <VenueDetailPanel
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
        />
      )}
    </div>
  );
}
