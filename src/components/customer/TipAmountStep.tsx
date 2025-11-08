import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Wallet } from "lucide-react";

interface TipAmountStepProps {
  serverName: string;
  currency: string;
  onContinue: (amount: number, method: "card" | "crypto") => void;
  onSkip: () => void;
}

const QUICK_AMOUNTS = [1, 3, 5, 10, 20, 50];

export function TipAmountStep({ serverName, currency, onContinue, onSkip }: TipAmountStepProps) {
  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);

  const handleQuickAmount = (value: number) => {
    setAmount(value);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleCustomInput = (value: string) => {
    setCustomAmount(value);
    setIsCustom(true);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  const finalAmount = isCustom && customAmount ? parseFloat(customAmount) : amount;

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-md w-full px-4 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Leave a tip?
          </h2>
          <p className="text-lg text-muted-foreground">
            100% goes to {serverName}
          </p>
        </div>

        {/* Quick Amount Pills */}
        <div className="grid grid-cols-3 gap-3">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              onClick={() => handleQuickAmount(value)}
              className={`
                glass-panel rounded-full py-4 px-6 text-xl font-bold
                transition-all duration-300 hover:scale-105 active:scale-95
                ${!isCustom && amount === value ? 'ring-2 ring-primary bg-primary/10' : ''}
              `}
            >
              ${value}
            </button>
          ))}
        </div>

        {/* Custom Amount Input */}
        <Card className="glass-panel border-none">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Custom Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => handleCustomInput(e.target.value)}
                  className="w-full bg-muted/50 border border-border/50 rounded-xl pl-10 pr-4 py-4 text-3xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  step="0.01"
                  min="0"
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">{currency}</p>
            </div>
          </CardContent>
        </Card>

        {/* Live Display */}
        {finalAmount > 0 && (
          <Card className="glass-panel border-primary/20 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">You're tipping</p>
              <p className="number-display text-4xl">${finalAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-center text-muted-foreground">
            Choose payment method
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onContinue(finalAmount, "card")}
              disabled={finalAmount <= 0}
              size="lg"
              variant="outline"
              className="h-14 rounded-full"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Card
            </Button>
            <Button
              onClick={() => onContinue(finalAmount, "crypto")}
              disabled={finalAmount <= 0}
              size="lg"
              className="h-14 rounded-full"
            >
              <Wallet className="mr-2 h-5 w-5" />
              Crypto
            </Button>
          </div>
        </div>

        {/* Skip Option */}
        <button
          onClick={onSkip}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip tip, just leave review
        </button>
      </div>
    </div>
  );
}
