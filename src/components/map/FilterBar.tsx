import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X, MapPin } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
      {/* Mobile: FAB (Center-Bottom) */}
      <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-30">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          size="icon"
          className="h-14 w-14 rounded-full backdrop-blur-xl bg-white/20 dark:bg-white/10 border border-white/30 shadow-2xl shadow-black/10 hover:scale-105 hover:bg-white/30 transition-all duration-300"
        >
          <SlidersHorizontal className="h-5 w-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shadow-lg">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile: Bottom Sheet */}
      <div
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-20 transition-transform duration-300 ease-out pb-safe",
          isExpanded ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="backdrop-blur-2xl bg-background/70 dark:bg-background/80 rounded-t-3xl p-6 space-y-6 max-h-[70vh] overflow-y-auto shadow-2xl border-t-2 border-white/20">
          {/* Handle */}
          <div className="flex justify-center -mt-2 mb-2">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Sentiment Filter */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">Sentiment</div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.sentiment === null ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterChange({ ...filters, sentiment: null })}
                className="rounded-full"
              >
                All
              </Button>
              {sentiments.map((s) => (
                <Button
                  key={s.emoji}
                  variant={filters.sentiment === s.emoji ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, sentiment: s.emoji })}
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
                onClick={() => onFilterChange({ ...filters, category: null })}
                className="rounded-full"
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={filters.category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFilterChange({ ...filters, category: cat })}
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

      {/* Desktop: Floating Dock Bar (Bottom-Center) */}
      <div className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-10">
        <TooltipProvider>
          <div className="backdrop-blur-xl bg-background/80 border border-border/50 rounded-full px-6 py-3 shadow-2xl flex items-center gap-4 max-w-fit">
            {/* Sentiment Emojis */}
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={filters.sentiment === null ? "default" : "ghost"}
                    size="icon"
                    onClick={() => onFilterChange({ ...filters, sentiment: null })}
                    className="h-9 w-9 rounded-full"
                  >
                    <span className="text-base">All</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Show All</TooltipContent>
              </Tooltip>

              {sentiments.map((s) => (
                <Tooltip key={s.emoji}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={filters.sentiment === s.emoji ? "default" : "ghost"}
                      size="icon"
                      onClick={() => onFilterChange({ ...filters, sentiment: s.emoji })}
                      className={cn(
                        "h-9 w-9 rounded-full transition-transform",
                        filters.sentiment === s.emoji && "scale-110"
                      )}
                    >
                      <span className="text-lg">{s.emoji}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{s.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>

            <div className="h-6 w-px bg-border/50" />

            {/* Category Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={filters.category ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {filters.category ? (
                    <span className="capitalize">{filters.category}</span>
                  ) : (
                    "Category"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2 rounded-xl" align="center">
                <div className="space-y-1">
                  <Button
                    variant={filters.category === null ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onFilterChange({ ...filters, category: null })}
                    className="w-full justify-start rounded-lg"
                  >
                    All Categories
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={filters.category === cat ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onFilterChange({ ...filters, category: cat })}
                      className="w-full justify-start rounded-lg capitalize"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear All (only show when filters active) */}
            {activeFilterCount > 0 && (
              <>
                <div className="h-6 w-px bg-border/50" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        onFilterChange({ sentiment: null, audience: null, category: null })
                      }
                      className="h-9 w-9 rounded-full hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear All Filters</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </TooltipProvider>
      </div>

      {/* Mobile: Backdrop when expanded */}
      {isExpanded && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-[2px] z-15"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}
