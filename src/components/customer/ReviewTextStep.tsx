import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ReviewTextStepProps {
  onSubmit: (text: string) => void;
  onSkip: () => void;
}

export function ReviewTextStep({ onSubmit, onSkip }: ReviewTextStepProps) {
  const [text, setText] = useState("");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">Want to share more?</h2>
        <p className="text-muted-foreground">Optional, but always appreciated</p>
      </div>

      <Card className="glass-panel border-none max-w-lg mx-auto">
        <CardContent className="pt-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell us about your experience..."
            className="min-h-32 resize-none bg-muted/50 border-border/50"
          />
        </CardContent>
      </Card>

      <div className="flex gap-3 max-w-lg mx-auto">
        <Button
          variant="outline"
          onClick={onSkip}
          className="flex-1"
        >
          Skip
        </Button>
        <Button
          onClick={() => onSubmit(text)}
          disabled={!text.trim()}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}