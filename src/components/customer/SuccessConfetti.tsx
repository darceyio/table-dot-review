import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function SuccessConfetti({ message }: { message: string }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    // Generate confetti particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.3,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="relative py-16 animate-in fade-in zoom-in duration-700">
      {/* Confetti */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-primary rounded-full animate-float-up"
          style={{
            left: `${particle.x}%`,
            top: "50%",
            animationDelay: `${particle.delay}s`,
            opacity: 0,
          }}
        />
      ))}

      {/* Success icon */}
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-success/20 rounded-full blur-2xl animate-pulse" />
          <CheckCircle2 className="relative h-20 w-20 text-success animate-in zoom-in duration-700" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">{message}</h3>
          <p className="text-muted-foreground">Thanks for showing love ✨</p>
        </div>
      </div>
    </div>
  );
}