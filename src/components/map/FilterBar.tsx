import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const sentiments = [
    { emoji: "😍", label: "Excellent" },
    { emoji: "😃", label: "Great" },
    { emoji: "🙂", label: "Good" },
    { emoji: "😐", label: "Okay" },
    { emoji: "😕", label: "Poor" },
    { emoji: "😡", label: "Bad" },
  ];

  const categories = ["cafe", "restaurant", "bar", "coworking"];

  return (
    <div className="absolute top-4 left-4 right-4 z-10 md:left-auto md:right-auto md:left-1/2 md:-translate-x-1/2 md:w-auto">
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
  );
}
