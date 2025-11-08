import { Card } from "@/components/ui/card";

interface EmojiRatingStepProps {
  onSelect: (rating: 1 | 2 | 3 | 4 | 5) => void;
}

const emojis = [
  { value: 1 as const, emoji: "😡", label: "Terrible", color: "hover:bg-destructive/10" },
  { value: 2 as const, emoji: "😕", label: "Poor", color: "hover:bg-orange-500/10" },
  { value: 3 as const, emoji: "😐", label: "Okay", color: "hover:bg-muted" },
  { value: 4 as const, emoji: "😊", label: "Good", color: "hover:bg-success/10" },
  { value: 5 as const, emoji: "🤩", label: "Amazing", color: "hover:bg-primary/10" },
];

export function EmojiRatingStep({ onSelect }: EmojiRatingStepProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl w-full px-4 space-y-8">
        {/* Question */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            How was your experience today?
          </h2>
          <p className="text-lg text-muted-foreground">
            Tap the face that matches your visit
          </p>
        </div>

        {/* Emoji Grid */}
        <div className="grid grid-cols-5 gap-3 md:gap-4 max-w-xl mx-auto">
          {emojis.map(({ value, emoji, label, color }) => (
            <button
              key={value}
              onClick={() => onSelect(value)}
              className={`glass-panel border-border/50 p-4 md:p-6 rounded-2xl flex flex-col items-center gap-3 group transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95 ${color}`}
            >
              <span className="text-5xl md:text-6xl group-hover:scale-110 transition-transform duration-300">
                {emoji}
              </span>
              <span className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-foreground">
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Helper Text */}
        <p className="text-center text-sm text-muted-foreground">
          Your feedback helps great service get recognized
        </p>
      </div>
    </div>
  );
}
