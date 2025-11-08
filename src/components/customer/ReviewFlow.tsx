import { useState } from "react";
import { ContextCard } from "./ContextCard";
import { EmojiRatingStep } from "./EmojiRatingStep";
import { ServerSelectionStep } from "./ServerSelectionStep";
import { TipAmountStep } from "./TipAmountStep";
import { NoteStep } from "./NoteStep";
import { ConfirmationStep } from "./ConfirmationStep";
import CryptoTipForm from "@/components/CryptoTipForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewFlowProps {
  qrCode: string;
  venueName: string;
  venueSlug: string;
  serverName: string;
  serverId: string;
  serverWallet: string | null;
  orgId: string;
  locationId: string | null;
  assignmentId: string;
}

type Step = "context" | "rating" | "server" | "tip" | "note" | "crypto" | "confirmation";

export function ReviewFlow({
  qrCode,
  venueName,
  venueSlug,
  serverName,
  serverId,
  serverWallet,
  orgId,
  locationId,
  assignmentId,
}: ReviewFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>("context");
  const [reviewData, setReviewData] = useState({
    rating: 0,
    selectedServerId: serverId,
    tipAmount: 0,
    paymentMethod: "crypto" as "card" | "crypto",
    note: "",
  });
  const { toast } = useToast();

  const handleRatingSelect = (rating: number) => {
    setReviewData((prev) => ({ ...prev, rating }));
    setCurrentStep("server");
  };

  const handleServerSelect = (selectedServerId: string | null) => {
    setReviewData((prev) => ({
      ...prev,
      selectedServerId: selectedServerId || serverId,
    }));
  };

  const handleServerContinue = () => {
    setCurrentStep("tip");
  };

  const handleTipContinue = (amount: number, method: "card" | "crypto") => {
    setReviewData((prev) => ({ ...prev, tipAmount: amount, paymentMethod: method }));
    
    if (method === "crypto" && serverWallet) {
      setCurrentStep("crypto");
    } else {
      // If card or no wallet, skip to note
      setCurrentStep("note");
    }
  };

  const handleTipSkip = () => {
    setReviewData((prev) => ({ ...prev, tipAmount: 0 }));
    setCurrentStep("note");
  };

  const handleNoteSubmit = async (note: string) => {
    setReviewData((prev) => ({ ...prev, note }));
    await submitReview(note);
  };

  const handleNoteSkip = async () => {
    await submitReview("");
  };

  const handleCryptoSuccess = async () => {
    setCurrentStep("note");
  };

  const submitReview = async (note: string) => {
    try {
      // Map rating (1-5) to sentiment
      const sentiment = reviewData.rating >= 4 ? "positive" : reviewData.rating === 3 ? "neutral" : "negative";

      const { error } = await supabase.from("review").insert({
        org_id: orgId,
        location_id: locationId,
        server_id: reviewData.selectedServerId,
        server_assignment_id: assignmentId,
        sentiment,
        text: note || null,
        is_anonymous: true,
      });

      if (error) throw error;

      setCurrentStep("confirmation");
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

  switch (currentStep) {
    case "context":
      return (
        <ContextCard
          venueName={venueName}
          venueSlug={venueSlug}
          serverName={serverName}
          onStart={() => setCurrentStep("rating")}
        />
      );

    case "rating":
      return <EmojiRatingStep onSelect={handleRatingSelect} />;

    case "server":
      return (
        <ServerSelectionStep
          preSelectedServer={{ id: serverId, name: serverName, avatarUrl: null }}
          onSelect={handleServerSelect}
          onContinue={handleServerContinue}
        />
      );

    case "tip":
      return (
        <TipAmountStep
          serverName={serverName}
          currency="USD"
          onContinue={handleTipContinue}
          onSkip={handleTipSkip}
        />
      );

    case "crypto":
      return serverWallet ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <CryptoTipForm
              qrCode={qrCode}
              serverWallet={serverWallet}
              serverName={serverName}
              onSuccess={handleCryptoSuccess}
            />
          </div>
        </div>
      ) : (
        <div>No wallet configured</div>
      );

    case "note":
      return (
        <NoteStep
          serverName={serverName}
          onSubmit={handleNoteSubmit}
          onSkip={handleNoteSkip}
        />
      );

    case "confirmation":
      return (
        <ConfirmationStep
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
