import { useState, useEffect } from "react";
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { parseEther } from "viem";
import { base, baseSepolia, polygon, arbitrum, mainnet } from "wagmi/chains";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, Wallet, AlertCircle } from "lucide-react";
import { getTokenPrice, usdToCrypto, formatTokenAmount } from "@/lib/cryptoPrice";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CryptoTipStepProps {
  qrCode: string;
  serverWallet: string;
  serverName: string;
  usdAmount: number;
  onSuccess: () => void;
  onBack?: () => void;
}

const CHAINS = [
  { id: baseSepolia.id, name: "Base Sepolia", symbol: "ETH", recommended: true },
  { id: base.id, name: "Base", symbol: "ETH" },
  { id: polygon.id, name: "Polygon", symbol: "MATIC" },
  { id: arbitrum.id, name: "Arbitrum", symbol: "ETH" },
  { id: mainnet.id, name: "Ethereum", symbol: "ETH" },
];

export function CryptoTipStep({ 
  qrCode, 
  serverWallet, 
  serverName, 
  usdAmount,
  onSuccess,
  onBack 
}: CryptoTipStepProps) {
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();
  
  const [selectedChainId, setSelectedChainId] = useState<number>(baseSepolia.id);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  const selectedChain = CHAINS.find(c => c.id === selectedChainId);
  
  const { data: txHash, sendTransaction, isPending: isSending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Fetch token price when chain changes
  useEffect(() => {
    if (selectedChain) {
      setIsLoadingPrice(true);
      getTokenPrice(selectedChain.symbol)
        .then(price => {
          setTokenPrice(price);
          const amount = usdToCrypto(usdAmount, price);
          setCryptoAmount(amount);
        })
        .catch(err => {
          console.error("Failed to fetch price:", err);
          toast({
            title: "Price Error",
            description: "Could not fetch current crypto prices. Please try again.",
            variant: "destructive",
          });
        })
        .finally(() => setIsLoadingPrice(false));
    }
  }, [selectedChainId, usdAmount]);

  const handleSendTip = async () => {
    if (!isConnected || !address || !cryptoAmount || !tokenPrice) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // Check if on correct chain
    if (chain?.id !== selectedChainId) {
      try {
        await switchChain({ chainId: selectedChainId });
      } catch (error) {
        toast({
          title: "Network Error",
          description: "Please switch to the correct network in your wallet",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setTxStatus("pending");
      
      await sendTransaction({
        to: serverWallet as `0x${string}`,
        value: parseEther(cryptoAmount),
        chainId: selectedChainId,
      });
    } catch (error: any) {
      console.error("Transaction error:", error);
      setTxStatus("error");
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to send transaction",
        variant: "destructive",
      });
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (txHash && txStatus === "pending") {
      setTxStatus("success");
      
      // Record tip in background
      supabase.functions.invoke("record-crypto-tip", {
        body: {
          qr_code: qrCode,
          tx_hash: txHash,
          from_address: address,
          chain_id: selectedChainId,
          amount_in_smallest_unit: parseEther(cryptoAmount).toString(),
        },
      }).catch(console.error);
      
      toast({
        title: "Tip Sent! 🎉",
        description: `${serverName} will receive your ${formatTokenAmount(cryptoAmount, selectedChain?.symbol || "ETH")} ${selectedChain?.symbol} tip`,
      });

      // Wait a moment then proceed
      setTimeout(onSuccess, 1500);
    }
  }, [txHash]);

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-md w-full px-4 space-y-8">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="glass-panel rounded-full p-6">
                <Wallet className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Connect Your Wallet
            </h2>
            <p className="text-lg text-muted-foreground">
              To send a crypto tip to {serverName}
            </p>
          </div>

          <div className="flex justify-center">
            <ConnectButton />
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Go back
            </button>
          )}
        </div>
      </div>
    );
  }

  if (txStatus === "success") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-md w-full px-4 space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-20 w-20 text-primary animate-in zoom-in duration-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Tip Sent! 🎉
            </h2>
            <p className="text-lg text-muted-foreground">
              Your transaction has been submitted
            </p>
          </div>

          <Card className="glass-panel border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-mono font-semibold">
                  {formatTokenAmount(cryptoAmount, selectedChain?.symbol || "ETH")} {selectedChain?.symbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <span>{selectedChain?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="text-primary">
                  {isConfirming ? "Confirming..." : "Submitted"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-md w-full px-4 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Confirm Your Tip
          </h2>
          <p className="text-lg text-muted-foreground">
            Sending ${usdAmount} to {serverName}
          </p>
        </div>

        {/* Network Selector */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Select Network</p>
          <div className="grid grid-cols-2 gap-3">
            {CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => setSelectedChainId(chain.id)}
                disabled={isLoadingPrice || txStatus === "pending"}
                className={`
                  glass-panel rounded-xl py-4 px-4 text-left
                  transition-all duration-300 hover:scale-[1.02] active:scale-95
                  ${selectedChainId === chain.id ? 'ring-2 ring-primary bg-primary/10' : ''}
                `}
              >
                <div className="font-semibold text-sm">{chain.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{chain.symbol}</div>
                {chain.recommended && (
                  <div className="text-xs text-primary mt-1">⭐ Recommended</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Display */}
        {cryptoAmount && tokenPrice && (
          <Card className="glass-panel border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">You're sending</p>
                <p className="number-display text-4xl">
                  {formatTokenAmount(cryptoAmount, selectedChain?.symbol || "ETH")} {selectedChain?.symbol}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  ≈ ${usdAmount.toFixed(2)} USD
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction Status */}
        {(isSending || isConfirming || txStatus === "pending") && (
          <Card className="glass-panel border-primary/20">
            <CardContent className="pt-6 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {isSending 
                    ? "Confirm in wallet..." 
                    : "Processing transaction..."}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This may take a few moments
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {txStatus === "error" && (
          <Card className="glass-panel border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">Transaction failed. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSendTip}
          disabled={!cryptoAmount || isLoadingPrice || isSending || isConfirming || txStatus === "pending"}
          size="lg"
          className="w-full h-14 rounded-full text-lg"
        >
          {isSending || isConfirming ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {isSending ? "Confirm in Wallet" : "Processing..."}
            </>
          ) : (
            `Send Tip`
          )}
        </Button>

        {onBack && (
          <button
            onClick={onBack}
            disabled={txStatus === "pending"}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Go back
          </button>
        )}
      </div>
    </div>
  );
}
