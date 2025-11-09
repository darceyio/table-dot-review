type Step = "context" | "rating" | "server" | "tip" | "note" | "stripe-card" | "crypto" | "confirmation";

interface ReviewFlowState {
  qrCode: string;
  reviewData: {
    rating: number;
    emoji: string;
    note: string;
    selectedServerId: string;
    tipAmount: number;
    paymentMethod: "card" | "crypto";
  };
  currentStep: Step;
  visitId: string | null;
  txHash?: string;
  timestamp: number;
}

const STATE_KEY_PREFIX = "review_flow_";
const MAX_AGE_MS = 3600000; // 1 hour

export function saveReviewState(qrCode: string, state: Omit<ReviewFlowState, "timestamp">): void {
  try {
    const stateWithTimestamp: ReviewFlowState = {
      ...state,
      timestamp: Date.now(),
    };
    localStorage.setItem(
      `${STATE_KEY_PREFIX}${qrCode}`,
      JSON.stringify(stateWithTimestamp)
    );
  } catch (error) {
    console.error("Failed to save review state:", error);
  }
}

export function loadReviewState(qrCode: string): ReviewFlowState | null {
  try {
    const saved = localStorage.getItem(`${STATE_KEY_PREFIX}${qrCode}`);
    if (!saved) return null;

    const state = JSON.parse(saved) as ReviewFlowState;
    
    // Validate required fields
    if (!state.qrCode || !state.reviewData || !state.currentStep) {
      clearReviewState(qrCode);
      return null;
    }

    // Check if expired
    if (isStateExpired(state.timestamp)) {
      clearReviewState(qrCode);
      return null;
    }

    return state;
  } catch (error) {
    console.error("Failed to load review state:", error);
    return null;
  }
}

export function clearReviewState(qrCode: string): void {
  try {
    localStorage.removeItem(`${STATE_KEY_PREFIX}${qrCode}`);
  } catch (error) {
    console.error("Failed to clear review state:", error);
  }
}

export function isStateExpired(timestamp: number, maxAge: number = MAX_AGE_MS): boolean {
  return Date.now() - timestamp > maxAge;
}
