import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Stripe will be initialized dynamically with the publishable key from server
// const stripePromise = loadStripe("pk_test_xxx"); // removed: loaded at runtime

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

function CheckoutForm({
  serverName,
  tipAmount,
  currency,
  onBack,
  onSuccess,
}: {
  serverName: string;
  tipAmount: number;
  currency: string;
  onBack: () => void;
  onSuccess: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();

  // Wait for PaymentElement to be ready
  useEffect(() => {
    if (stripe && elements) {
      setIsReady(true);
    }
  }, [stripe, elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Payment not ready",
        description: "Please wait for the payment form to load",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Submit the PaymentElement to validate fields
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: "if_required",
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Update tip status in database
        await supabase.functions.invoke("update-tip-status", {
          body: {
            payment_intent_id: paymentIntent.id,
            status: "succeeded",
          },
        });

        toast({
          title: "Payment successful!",
          description: "Your tip has been sent",
        });
        onSuccess(paymentIntent.id);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Display */}
      <div className="glass-panel p-6 text-center">
        <div className="text-sm text-muted-foreground mb-2">Tip amount</div>
        <div className="number-display text-5xl">
          {currency === "USD" ? "$" : "€"}
          {tipAmount.toFixed(2)}
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="glass-panel p-6">
        <PaymentElement
          onReady={() => setIsReady(true)}
          options={{
            layout: "tabs",
            wallets: {
              applePay: "auto",
              googlePay: "auto",
            },
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 h-14"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !isReady || isProcessing}
          className="flex-1 h-14 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              Processing...
            </div>
          ) : !isReady ? (
            "Loading..."
          ) : (
            `Pay ${currency === "USD" ? "$" : "€"}${tipAmount.toFixed(2)}`
          )}
        </Button>
      </div>

      {/* Stripe Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Powered by Stripe</span>
      </div>
    </form>
  );
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
  const [clientSecret, setClientSecret] = useState<string>("");
  const [email, setEmail] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const { toast } = useToast();

  // Fetch publishable key and init Stripe.js
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("stripe-config");
        if (error) throw error;
        if (!data?.publishable_key?.startsWith("pk_")) {
          throw new Error("Invalid Stripe publishable key");
        }
        setStripePromise(loadStripe(data.publishable_key));
      } catch (e: any) {
        console.error("Stripe init error:", e);
        toast({
          title: "Stripe not ready",
          description: e.message || "Failed to load Stripe",
          variant: "destructive",
        });
      }
    })();
  }, []);

  // Reset payment form when going back
  const handleBackToForm = () => {
    setShowPaymentForm(false);
    setClientSecret("");
  };

  const handleContinue = async () => {
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

    setIsLoading(true);

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

      if (data?.client_secret) {
        console.log("Client secret received, length:", data.client_secret.length);
        setClientSecret(data.client_secret);
        setShowPaymentForm(true);
      } else {
        throw new Error("No client secret returned from payment setup");
      }
    } catch (error: any) {
      console.error("Payment setup error:", error);
      toast({
        title: "Setup failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
              disabled={isLoading}
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

        <CardContent>
          {!showPaymentForm ? (
            <div className="space-y-6">
              {/* Amount Display */}
              <div className="glass-panel p-6 text-center">
                <div className="text-sm text-muted-foreground mb-2">Tip amount</div>
                <div className="number-display text-5xl">
                  {currency === "USD" ? "$" : "€"}
                  {tipAmount.toFixed(2)}
                </div>
              </div>

              {/* Email & Name Form */}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                    className="h-12 bg-background/50 border-border/60 focus-visible:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleContinue}
                disabled={isLoading}
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Setting up...
                  </div>
                ) : (
                  "Continue to Payment"
                )}
              </Button>
            </div>
          ) : clientSecret && stripePromise ? (
            <Elements
              stripe={stripePromise}
              key={clientSecret}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "hsl(var(--primary))",
                    colorBackground: "hsl(var(--background))",
                    colorText: "hsl(var(--foreground))",
                    colorDanger: "hsl(var(--destructive))",
                    fontFamily: "system-ui, sans-serif",
                    borderRadius: "12px",
                  },
                },
              }}
            >
              <CheckoutForm
                serverName={serverName}
                tipAmount={tipAmount}
                currency={currency}
                onBack={handleBackToForm}
                onSuccess={onSuccess}
              />
            </Elements>
          ) : (
            <div className="text-center p-8">
              <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Initializing payment...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
