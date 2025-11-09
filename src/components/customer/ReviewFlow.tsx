import { useState, useEffect } from "react";
import { ContextCard } from "./ContextCard";
import { EmojiRatingStep } from "./EmojiRatingStep";
import { ServerSelectionStep } from "./ServerSelectionStep";
import { TipAmountStep } from "./TipAmountStep";
import { NoteStep } from "./NoteStep";
import { ConfirmationStep } from "./ConfirmationStep";
import { CryptoTipStep } from "./CryptoTipStep";
import { StripeCardTipStep } from "./StripeCardTipStep";
import { ReviewProgressBar } from "./ReviewProgressBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { saveReviewState, loadReviewState } from "@/lib/reviewFlowState";

interface ReviewFlowProps {
  qrCode: string;
  qrCodeId: string;
  venueName: string;
  venueSlug: string;
  serverName: string;
  serverId: string;
  serverWallet: string | null;
  serverAvatarUrl: string | null;
  orgId: string;
  locationId: string | null;
  assignmentId: string;
}

type Step = "context" | "rating" | "server" | "tip" | "note" | "stripe-card" | "crypto" | "confirmation";

export function ReviewFlow({
  qrCode,
  qrCodeId,
  venueName,
  venueSlug,
  serverName,
  serverId,
  serverWallet,
  serverAvatarUrl,
  orgId,
  locationId,
  assignmentId,
}: ReviewFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>("context");
  const [stepHistory, setStepHistory] = useState<Step[]>(["context"]);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    selectedServerId: serverId,
    tipAmount: 0,
    paymentMethod: "crypto" as "card" | "crypto",
    note: "",
    emoji: "",
  });
  const { toast } = useToast();

  // Restore state on mount
  useEffect(() => {
    const savedState = loadReviewState(qrCode);
    if (savedState) {
      setReviewData(savedState.reviewData);
      setCurrentStep(savedState.currentStep);
      setVisitId(savedState.visitId);
      toast({
        title: "Continuing where you left off...",
        description: "Your review progress has been restored",
      });
    }
  }, [qrCode]);

  // Save state on changes
  useEffect(() => {
    if (visitId) {
      saveReviewState(qrCode, {
        qrCode,
        reviewData,
        currentStep,
        visitId,
      });
    }
  }, [reviewData, currentStep, visitId, qrCode]);

  const navigateToStep = (step: Step) => {
    setCurrentStep(step);
    setStepHistory((prev) => [...prev, step]);
  };

  const goBack = () => {
    if (stepHistory.length > 1) {
      const newHistory = stepHistory.slice(0, -1);
      const previousStep = newHistory[newHistory.length - 1];
      setStepHistory(newHistory);
      setCurrentStep(previousStep);
    }
  };

  const getStepNumber = (): number => {
    const stepOrder: Step[] = ["context", "rating", "note", "server", "tip", "stripe-card", "crypto", "confirmation"];
    return stepOrder.indexOf(currentStep) + 1;
  };

  const getTotalSteps = (): number => {
    // Dynamic total based on payment method
    if (reviewData.paymentMethod === "crypto" && serverWallet) {
      return 7; // includes crypto step
    } else if (reviewData.paymentMethod === "card") {
      return 7; // includes stripe-card step
    }
    return 6; // no payment step
  };

  const createVisit = async () => {
    try {
      const { data, error } = await supabase
        .from("visits")
        .insert({
          qr_code_id: qrCodeId,
          venue_id: locationId || orgId,
          server_id: serverId,
          is_local: false,
          is_international: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error("Failed to create visit:", error);
      return null;
    }
  };

  const handleRatingSelect = async (rating: number, emoji: string) => {
    // Create visit on first interaction
    if (!visitId) {
      const newVisitId = await createVisit();
      if (newVisitId) {
        setVisitId(newVisitId);
      }
    }

    setReviewData((prev) => ({ ...prev, rating, emoji }));
    navigateToStep("note");
  };

  const handleNoteSubmit = async (note: string) => {
    setReviewData((prev) => ({ ...prev, note }));
    await submitReview(note);
  };

  const handleNoteSkip = async () => {
    await submitReview("");
  };

  const handleServerSelect = (selectedServerId: string | null) => {
    setReviewData((prev) => ({
      ...prev,
      selectedServerId: selectedServerId || serverId,
    }));
  };

  const handleServerContinue = () => {
    navigateToStep("tip");
  };

  const handleTipContinue = (amount: number, method: "card" | "crypto") => {
    setReviewData((prev) => ({ ...prev, tipAmount: amount, paymentMethod: method }));
    
    if (method === "crypto" && serverWallet) {
      navigateToStep("crypto");
    } else if (method === "card") {
      navigateToStep("stripe-card");
    } else {
      // If no wallet, go to confirmation
      navigateToStep("confirmation");
    }
  };

  const handleTipSkip = () => {
    setReviewData((prev) => ({ ...prev, tipAmount: 0 }));
    navigateToStep("confirmation");
  };

  const handleStripeSuccess = (paymentIntentId: string) => {
    console.log("Stripe payment successful:", paymentIntentId);
    navigateToStep("confirmation");
  };

  const handleCryptoSuccess = async () => {
    navigateToStep("confirmation");
  };

  const submitReview = async (note: string) => {
    try {
      // Map rating (1-5) to sentiment
      const sentiment = reviewData.rating >= 4 ? "positive" : reviewData.rating === 3 ? "neutral" : "negative";

      const { error } = await supabase.from("review").insert({
        visit_id: visitId,
        org_id: orgId,
        location_id: locationId,
        server_id: reviewData.selectedServerId,
        server_assignment_id: assignmentId,
        sentiment,
        rating_emoji: reviewData.emoji,
        comment: note || null,
        is_anonymous: true,
      });

      if (error) throw error;

      // Trigger metrics recalculation in the background (don't wait for it)
      // Use locationId if available, otherwise use orgId for org-level metrics
      const metricsTarget = locationId || orgId;
      if (metricsTarget) {
        supabase.functions
          .invoke('calculate-venue-metrics', {
            body: { venue_id: metricsTarget }
          })
          .then(({ error: metricsError }) => {
            if (metricsError) {
              console.error('Failed to update venue metrics:', metricsError);
            } else {
              console.log('Venue metrics updated successfully for:', metricsTarget);
            }
          });
      }

      // After review is submitted, move to server selection
      navigateToStep("server");
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDone = () => {
    // Reset or redirect
    window.location.href = "/";
  };

  const showProgressBar = currentStep !== "context" && currentStep !== "confirmation";
  const canGoBack = stepHistory.length > 1 && currentStep !== "context" && currentStep !== "confirmation";

  return (
    <>
      {showProgressBar && (
        <ReviewProgressBar
          currentStep={getStepNumber()}
          totalSteps={getTotalSteps()}
          onBack={goBack}
          canGoBack={canGoBack}
        />
      )}
      
      <div className={showProgressBar ? "pt-20" : ""}>
        {renderCurrentStep()}
      </div>
    </>
  );

  function renderCurrentStep() {
    switch (currentStep) {
      case "context":
        return (
          <ContextCard
            venueName={venueName}
            venueSlug={venueSlug}
            serverName={serverName}
            onStart={() => navigateToStep("rating")}
          />
        );

      case "rating":
        return <EmojiRatingStep onSelect={handleRatingSelect} />;

      case "note":
        return (
          <NoteStep
            serverName={serverName}
            onSubmit={handleNoteSubmit}
            onSkip={handleNoteSkip}
          />
        );

      case "server":
        return (
          <ServerSelectionStep
            preSelectedServer={{ id: serverId, name: serverName, avatarUrl: serverAvatarUrl }}
            onSelect={handleServerSelect}
            onContinue={handleServerContinue}
          />
        );

      case "tip":
        return (
          <TipAmountStep
            serverName={serverName}
            currency="USD"
            cryptoEnabled={!!serverWallet}
            onContinue={handleTipContinue}
            onSkip={handleTipSkip}
          />
        );

      case "stripe-card":
        return (
          <StripeCardTipStep
            serverName={serverName}
            tipAmount={reviewData.tipAmount}
            currency="USD"
            serverId={reviewData.selectedServerId}
            assignmentId={assignmentId}
            orgId={orgId}
            onBack={goBack}
            onSuccess={handleStripeSuccess}
          />
        );

      case "crypto":
        return serverWallet ? (
          <CryptoTipStep
            qrCode={qrCode}
            serverWallet={serverWallet}
            serverName={serverName}
            usdAmount={reviewData.tipAmount}
            onSuccess={handleCryptoSuccess}
            onBack={goBack}
          />
        ) : (
          <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in duration-500">
            <div className="max-w-md w-full px-4">
              <div className="glass-panel rounded-2xl p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
                  <Wallet className="h-8 w-8 text-orange-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Crypto Not Available</h3>
                  <p className="text-muted-foreground text-lg">
                    {serverName} hasn't set up their crypto wallet yet. Try paying with card instead!
                  </p>
                </div>
                <Button onClick={goBack} size="lg" className="w-full rounded-full">
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        );

      case "confirmation":
        return (
          <ConfirmationStep
            qrCode={qrCode}
            serverName={serverName}
            venueName={venueName}
            tipAmount={reviewData.tipAmount > 0 ? reviewData.tipAmount : undefined}
            onDone={handleDone}
          />
        );

      default:
        return null;
    }
  }
}
