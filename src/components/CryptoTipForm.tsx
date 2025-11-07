import { useState, useEffect } from "react";
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { parseEther, parseUnits, formatEther } from "viem";
import { base, polygon, arbitrum, mainnet } from "wagmi/chains";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { getTokenPrice, usdToCrypto, cryptoToUsd, formatTokenAmount } from "@/lib/cryptoPrice";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CryptoTipFormProps {
  qrCode: string;
  serverWallet: string;
  serverName: string;
  onSuccess?: () => void;
}

const CHAINS = [
  { id: base.id, name: "Base", symbol: "ETH", recommended: true },
  { id: polygon.id, name: "Polygon", symbol: "MATIC" },
  { id: arbitrum.id, name: "Arbitrum", symbol: "ETH" },
  { id: mainnet.id, name: "Ethereum", symbol: "ETH" },
];

const QUICK_AMOUNTS = [5, 10, 20, 50];

export default function CryptoTipForm({ qrCode, serverWallet, serverName, onSuccess }: CryptoTipFormProps) {
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();
  
  const [selectedChainId, setSelectedChainId] = useState<number>(base.id);
  const [usdAmount, setUsdAmount] = useState("10");
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  const selectedChain = CHAINS.find(c => c.id === selectedChainId);
  const { data: balance } = useBalance({ address, chainId: selectedChainId });
  
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
          updateCryptoAmount(usdAmount, price);
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
  }, [selectedChainId]);

  const updateCryptoAmount = (usd: string, price: number) => {
    if (!usd || !price) return;
    const amount = usdToCrypto(parseFloat(usd), price);
    setCryptoAmount(amount);
  };

  useEffect(() => {
    if (tokenPrice && usdAmount) {
      updateCryptoAmount(usdAmount, tokenPrice);
    }
  }, [usdAmount, tokenPrice]);

  const handleQuickAmount = (amount: number) => {
    setUsdAmount(amount.toString());
  };

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
      
      // Send transaction
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

  // Record tip when transaction confirms
  useEffect(() => {
    if (isConfirmed && txHash) {
      recordTip();
    }
  }, [isConfirmed, txHash]);

  const recordTip = async () => {
    if (!txHash || !address) return;

    try {
      const { data, error } = await supabase.functions.invoke("record-crypto-tip", {
        body: {
          qr_code: qrCode,
          tx_hash: txHash,
          from_address: address,
          chain_id: selectedChainId,
          amount_in_smallest_unit: parseEther(cryptoAmount).toString(),
        },
      });

      if (error) throw error;

      setTxStatus("success");
      toast({
        title: "Tip Sent! 🎉",
        description: `${serverName} received your ${formatTokenAmount(cryptoAmount, selectedChain?.symbol || "ETH")} ${selectedChain?.symbol} tip`,
      });

      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (error: any) {
      console.error("Failed to record tip:", error);
      setTxStatus("error");
      toast({
        title: "Recording Error",
        description: "Tip sent but failed to record. Please contact support with tx: " + txHash,
        variant: "destructive",
      });
    }
  };

  const getBlockExplorerUrl = () => {
    if (!txHash) return "";
    const explorers: { [key: number]: string } = {
      [base.id]: `https://basescan.org/tx/${txHash}`,
      [polygon.id]: `https://polygonscan.com/tx/${txHash}`,
      [arbitrum.id]: `https://arbiscan.io/tx/${txHash}`,
      [mainnet.id]: `https://etherscan.io/tx/${txHash}`,
    };
    return explorers[selectedChainId] || "";
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tip with Crypto</CardTitle>
          <CardDescription>Connect your wallet to tip {serverName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (txStatus === "success") {
    return (
      <Card className="border-primary">
        <CardContent className="pt-6 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Tip Sent Successfully!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {serverName} received your tip
            </p>
          </div>
          {txHash && (
            <Button variant="outline" size="sm" asChild>
              <a href={getBlockExplorerUrl()} target="_blank" rel="noopener noreferrer">
                View on Block Explorer <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Tip with Crypto
          {selectedChain?.recommended && <Badge variant="secondary">Recommended</Badge>}
        </CardTitle>
        <CardDescription>
          Tips go 100% to {serverName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chain Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Network</label>
          <Select value={selectedChainId.toString()} onValueChange={(v) => setSelectedChainId(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHAINS.map(chain => (
                <SelectItem key={chain.id} value={chain.id.toString()}>
                  {chain.name} {chain.recommended && "⭐"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Amount Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount (USD)</label>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map(amount => (
              <Button
                key={amount}
                variant={usdAmount === amount.toString() ? "default" : "outline"}
                onClick={() => handleQuickAmount(amount)}
                disabled={isLoadingPrice}
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Custom Amount</label>
          <Input
            type="number"
            placeholder="Enter USD amount"
            value={usdAmount}
            onChange={(e) => setUsdAmount(e.target.value)}
            disabled={isLoadingPrice}
          />
        </div>

        {/* Conversion Display */}
        {cryptoAmount && tokenPrice && (
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You send</span>
              <span className="font-mono font-semibold">
                {formatTokenAmount(cryptoAmount, selectedChain?.symbol || "ETH")} {selectedChain?.symbol}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rate</span>
              <span>1 {selectedChain?.symbol} = ${tokenPrice.toLocaleString()}</span>
            </div>
            {balance && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Your balance</span>
                <span>{parseFloat(formatEther(balance.value)).toFixed(6)} {balance.symbol}</span>
              </div>
            )}
          </div>
        )}

        {/* Transaction Status */}
        {(isSending || isConfirming) && (
          <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <div>
              <p className="text-sm font-medium">
                {isSending ? "Confirm in wallet..." : "Confirming on blockchain..."}
              </p>
              {txHash && (
                <a
                  href={getBlockExplorerUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View transaction <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {txStatus === "error" && (
          <div className="bg-destructive/10 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">Transaction failed. Please try again.</p>
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSendTip}
          disabled={!cryptoAmount || isLoadingPrice || isSending || isConfirming || txStatus === "pending"}
          className="w-full"
          size="lg"
        >
          {isSending || isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isSending ? "Confirm in Wallet" : "Confirming..."}
            </>
          ) : (
            `Send $${usdAmount} Tip`
          )}
        </Button>

        {/* Wallet Info */}
        <div className="text-xs text-center text-muted-foreground">
          <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          <ConnectButton.Custom>
            {({ openAccountModal }) => (
              <button onClick={openAccountModal} className="text-primary hover:underline">
                Change wallet
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      </CardContent>
    </Card>
  );
}
