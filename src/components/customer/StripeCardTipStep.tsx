import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StripeCardTipStepProps {
  serverName: string;
  tipAmount: number;
  currency: string;
  serverId: string;
  assignmentId: string;
  orgId: string;
  onBack: () => void;
  onSuccess: (paymentIntentId: string) => void;
}

export function StripeCardTipStep({
  serverName,
  tipAmount,
  currency,
  serverId,
  assignmentId,
  orgId,
  onBack,
  onSuccess,
}: StripeCardTipStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!cardholderName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter the cardholder name",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-stripe-payment", {
        body: {
          amount_cents: Math.round(tipAmount * 100),
          currency: currency.toLowerCase(),
          server_id: serverId,
          server_assignment_id: assignmentId,
          org_id: orgId,
          customer_email: email,
          cardholder_name: cardholderName,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe Checkout in new tab
        window.open(data.url, "_blank");
        
        toast({
          title: "Payment window opened",
          description: "Complete your payment in the new tab",
        });

        // For demo purposes, simulate success after a delay
        // In production, you'd use webhooks or redirect URLs
        setTimeout(() => {
          onSuccess(data.payment_intent_id || "demo_payment");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="glass-card w-full max-w-md border-border/40">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-10 w-10 rounded-full"
              disabled={isProcessing}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span className="text-xs">Secure payment</span>
            </div>
          </div>
          <CardTitle className="text-center text-3xl font-bold pt-4">
            Tip {serverName}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Amount Display */}
          <div className="glass-panel p-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">Tip amount</div>
            <div className="number-display text-5xl">
              {currency === "USD" ? "$" : "€"}
              {tipAmount.toFixed(2)}
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isProcessing}
                className="h-12 bg-background/50 border-border/60 focus-visible:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground">
                We'll send your receipt here
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardholderName" className="text-sm font-medium">
                Cardholder name
              </Label>
              <Input
                id="cardholderName"
                type="text"
                placeholder="Name on card"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                disabled={isProcessing}
                className="h-12 bg-background/50 border-border/60 focus-visible:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isProcessing ? (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5" />
                Pay {currency === "USD" ? "$" : "€"}
                {tipAmount.toFixed(2)}
              </div>
            )}
          </Button>

          {/* Stripe Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
            <Lock className="h-3 w-3" />
            <span>Powered by Stripe</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
