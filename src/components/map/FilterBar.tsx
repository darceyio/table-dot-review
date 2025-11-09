import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

interface Filters {
  sentiment: string | null;
  audience: string | null;
  category: string | null;
}

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sentiments = [
    { emoji: "😍", label: "Excellent" },
    { emoji: "😃", label: "Great" },
    { emoji: "🙂", label: "Good" },
    { emoji: "😐", label: "Okay" },
    { emoji: "😕", label: "Poor" },
    { emoji: "😡", label: "Bad" },
  ];

  const categories = ["cafe", "restaurant", "bar", "coworking"];

  const activeFilterCount = [filters.sentiment, filters.category].filter(Boolean).length;

  return (
    <>
      {/* Mobile: Bottom Sheet Toggle */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-10">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-full px-6 h-12 gap-2 shadow-lg glass-panel"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-primary-foreground text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile: Expandable Bottom Sheet */}
      <div
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-20 transition-transform duration-300 pb-safe",
          isExpanded ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="glass-panel rounded-t-3xl p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Handle */}
          <div className="flex justify-center">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Sentiment Filter */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">Sentiment</div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.sentiment === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  onFilterChange({ ...filters, sentiment: null });
                }}
                className="rounded-full"
              >
                All
              </Button>
              {sentiments.map((s) => (
                <Button
                  key={s.emoji}
                  variant={filters.sentiment === s.emoji ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onFilterChange({ ...filters, sentiment: s.emoji });
                  }}
                  className={cn("rounded-full", filters.sentiment === s.emoji && "scale-110")}
                >
                  <span className="mr-2">{s.emoji}</span>
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">Category</div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.category === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  onFilterChange({ ...filters, category: null });
                }}
                className="rounded-full"
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={filters.category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onFilterChange({ ...filters, category: cat });
                  }}
                  className="rounded-full capitalize"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Clear & Apply */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                onFilterChange({ sentiment: null, audience: null, category: null });
                setIsExpanded(false);
              }}
              className="flex-1 rounded-full"
            >
              Clear All
            </Button>
            <Button
              onClick={() => setIsExpanded(false)}
              className="flex-1 rounded-full"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop: Top Bar (original) */}
      <div className="hidden md:block absolute top-4 left-4 right-4 z-10 md:left-auto md:right-auto md:left-1/2 md:-translate-x-1/2 md:w-auto">
        <div className="glass-panel p-4 space-y-3 max-w-2xl">
          {/* Sentiment Filter */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Sentiment</div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={filters.sentiment === null ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterChange({ ...filters, sentiment: null })}
                className="rounded-full whitespace-nowrap"
              >
                All
              </Button>
              {sentiments.map((s) => (
                <Button
                  key={s.emoji}
                  variant={filters.sentiment === s.emoji ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, sentiment: s.emoji })}
                  className={cn("rounded-full whitespace-nowrap", filters.sentiment === s.emoji && "scale-110")}
                >
                  <span className="mr-2">{s.emoji}</span>
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Category</div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={filters.category === null ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterChange({ ...filters, category: null })}
                className="rounded-full whitespace-nowrap"
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={filters.category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, category: cat })}
                  className="rounded-full whitespace-nowrap capitalize"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Backdrop when expanded */}
      {isExpanded && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}
