import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Sparkles } from "lucide-react";

interface ConfirmationStepProps {
  serverName: string;
  venueName: string;
  tipAmount?: number;
  onCreateAccount?: () => void;
  onDone: () => void;
}

export function ConfirmationStep({ 
  serverName, 
  venueName, 
  tipAmount,
  onCreateAccount,
  onDone 
}: ConfirmationStepProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    // Generate confetti particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in zoom-in duration-700">
      <div className="max-w-md w-full px-4 relative">
        {/* Confetti */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full animate-float-up"
            style={{
              left: `${particle.x}%`,
              top: "30%",
              animationDelay: `${particle.delay}s`,
              opacity: 0,
              backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
            }}
          />
        ))}

        <Card className="glass-panel border-none relative z-10">
          <CardContent className="pt-12 pb-8 px-8 space-y-8 text-center">
            {/* Success Icon */}
            <div className="relative flex justify-center">
              <div className="absolute inset-0 bg-success/20 rounded-full blur-3xl animate-pulse" />
              <CheckCircle2 className="relative h-24 w-24 text-success animate-in zoom-in duration-700" />
            </div>

            {/* Thank You Message */}
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Thanks for showing love 💙
              </h2>
              <div className="space-y-2 text-muted-foreground">
                {tipAmount && (
                  <p className="text-lg">
                    Your <span className="font-bold text-success">${tipAmount.toFixed(2)}</span> tip is on its way to {serverName}
                  </p>
                )}
                <p className="text-base">
                  Your review helps {serverName} and {venueName} keep doing great work
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={onDone}
                size="lg"
                className="w-full rounded-full h-14 text-lg"
              >
                Done
              </Button>
              
              {onCreateAccount && (
                <Button
                  onClick={onCreateAccount}
                  variant="outline"
                  size="lg"
                  className="w-full rounded-full h-14"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Create account to track your impact
                </Button>
              )}
            </div>

            {/* Micro Copy */}
            <p className="text-xs text-muted-foreground">
              Totally optional • We'll link this and future visits
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
