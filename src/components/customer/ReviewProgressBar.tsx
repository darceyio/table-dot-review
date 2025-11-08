import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  canGoBack?: boolean;
}

export function ReviewProgressBar({ 
  currentStep, 
  totalSteps, 
  onBack,
  canGoBack = true 
}: ReviewProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/20">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          {canGoBack && onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full glass-panel shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}

          {/* Progress Container */}
          <div className="flex-1 space-y-2">
            {/* Step Counter */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-xs font-medium text-primary">
                {Math.round(progress)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/30 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
