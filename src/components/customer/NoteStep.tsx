import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface NoteStepProps {
  serverName: string;
  onSubmit: (note: string) => void;
  onSkip: () => void;
}

const MAX_CHARS = 280;

export function NoteStep({ serverName, onSubmit, onSkip }: NoteStepProps) {
  const [note, setNote] = useState("");

  const charsRemaining = MAX_CHARS - note.length;

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-md w-full px-4 space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Want to leave a quick note?
          </h2>
          <p className="text-lg text-muted-foreground">
            {serverName} made your day? Tell them why ✍️
          </p>
        </div>

        <Card className="glass-panel border-none">
          <CardContent className="pt-6 space-y-3">
            <Textarea
              value={note}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setNote(e.target.value);
                }
              }}
              placeholder="They were so attentive and made great recommendations..."
              className="min-h-32 resize-none bg-muted/30 border-border/50 text-base rounded-xl focus:ring-2 focus:ring-primary transition-all"
              maxLength={MAX_CHARS}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Optional but always appreciated</span>
              <span className={charsRemaining < 20 ? "text-warning" : ""}>
                {charsRemaining} characters left
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={onSkip}
            variant="outline"
            size="lg"
            className="flex-1 rounded-full h-14"
          >
            Skip
          </Button>
          <Button
            onClick={() => onSubmit(note)}
            disabled={!note.trim()}
            size="lg"
            className="flex-1 rounded-full h-14"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
