import { Card, CardContent } from "@/components/ui/card";
import { Smile, Meh, Frown } from "lucide-react";

interface ReviewSentimentStepProps {
  onSelect: (sentiment: "positive" | "neutral" | "negative") => void;
}

export function ReviewSentimentStep({ onSelect }: ReviewSentimentStepProps) {
  const sentiments = [
    { value: "positive" as const, icon: Smile, label: "Great", color: "text-success" },
    { value: "neutral" as const, icon: Meh, label: "Okay", color: "text-muted-foreground" },
    { value: "negative" as const, icon: Frown, label: "Not great", color: "text-destructive" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">How was your experience?</h2>
        <p className="text-muted-foreground">Your feedback helps us improve</p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
        {sentiments.map(({ value, icon: Icon, label, color }) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className="glass-panel p-8 hover:scale-105 active:scale-95 group"
          >
            <Icon className={`h-16 w-16 mx-auto mb-3 ${color} group-hover:scale-110 transition-transform`} />
            <p className="text-sm font-medium">{label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}