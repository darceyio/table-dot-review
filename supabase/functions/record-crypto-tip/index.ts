import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { createPublicClient, http } from "https://esm.sh/viem@2.21.0";
import { mainnet, base, baseSepolia, polygon, arbitrum } from "https://esm.sh/viem@2.21.0/chains";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHAINS: Record<number, any> = {
  1: mainnet,
  8453: base,
  84532: baseSepolia,
  137: polygon,
  42161: arbitrum,
};

const COINGECKO_IDS: Record<string, string> = {
  'ETH': 'ethereum',
  'MATIC': 'matic-network',
};

async function getTokenPrice(symbol: string): Promise<number> {
  const coinId = COINGECKO_IDS[symbol];
  if (!coinId) throw new Error(`Unsupported token: ${symbol}`);

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
  );
  
  if (!response.ok) throw new Error('Failed to fetch price');
  
  const data = await response.json();
  return data[coinId]?.usd || 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { qr_code, tx_hash, from_address, chain_id, amount_in_smallest_unit } = await req.json();

    if (!qr_code || !tx_hash || !from_address || !chain_id || !amount_in_smallest_unit) {
      throw new Error('Missing required fields');
    }

    console.log('Recording crypto tip:', { qr_code, tx_hash, chain_id });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if transaction already recorded (prevent replay attacks)
    const { data: existingTip } = await supabase
      .from('tip')
      .select('id')
      .eq('tx_hash', tx_hash)
      .maybeSingle();

    if (existingTip) {
      return new Response(
        JSON.stringify({ error: 'Transaction already recorded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get chain config
    const chain = CHAINS[chain_id];
    if (!chain) {
      throw new Error(`Unsupported chain: ${chain_id}`);
    }

    // Create public client to verify transaction
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    // Verify transaction on-chain with retry logic for mainnet delays
    console.log('Verifying transaction on chain:', chain.name);
    
    let receipt;
    let attempts = 0;
    const maxAttempts = 12; // Up to ~60 seconds
    
    while (attempts < maxAttempts) {
      try {
        receipt = await publicClient.getTransactionReceipt({ hash: tx_hash as `0x${string}` });
        break;
      } catch (error: any) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Transaction receipt not found after maximum retries. Transaction may still be pending.');
        }
        console.log(`Attempt ${attempts}/${maxAttempts}: Receipt not found, waiting 5s...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    if (!receipt || receipt.status !== 'success') {
      throw new Error('Transaction failed on-chain');
    }

    const transaction = await publicClient.getTransaction({ hash: tx_hash as `0x${string}` });

    // Resolve QR code to server assignment
    const { data: qrData, error: qrError } = await supabase
      .from('qr_code')
      .select(`
        code,
        is_active,
        server_assignment (
          id,
          server_id,
          org_id,
          location_id,
          payout_wallet_address
        )
      `)
      .eq('code', qr_code)
      .eq('is_active', true)
      .single();

    if (qrError || !qrData) {
      throw new Error('Invalid or inactive QR code');
    }

    const assignment = qrData.server_assignment as any;
    if (!assignment) {
      throw new Error('No active server assignment');
    }

    // Verify transaction recipient matches server wallet
    const expectedWallet = assignment.payout_wallet_address?.toLowerCase();
    const actualWallet = transaction.to?.toLowerCase();

    if (!expectedWallet || actualWallet !== expectedWallet) {
      throw new Error('Transaction recipient does not match server wallet');
    }

    // Verify amount matches
    if (transaction.value.toString() !== amount_in_smallest_unit) {
      throw new Error('Transaction amount mismatch');
    }

    // Get token price for USD conversion
    const tokenSymbol = chain.id === 137 ? 'MATIC' : 'ETH';
    const tokenPrice = await getTokenPrice(tokenSymbol);
    
    // Convert to USD cents
    const amountInEth = Number(amount_in_smallest_unit) / 1e18;
    const amountInUsd = amountInEth * tokenPrice;
    const amountCents = Math.round(amountInUsd * 100);

    // Calculate gas cost in cents
    const gasUsed = Number(receipt.gasUsed);
    const gasPrice = Number(receipt.effectiveGasPrice || 0);
    const gasCostInEth = (gasUsed * gasPrice) / 1e18;
    const gasCostCents = Math.round(gasCostInEth * tokenPrice * 100);

    // Insert tip record
    const { data: tip, error: tipError } = await supabase
      .from('tip')
      .insert({
        org_id: assignment.org_id,
        location_id: assignment.location_id,
        server_id: assignment.server_id,
        server_assignment_id: assignment.id,
        source: 'crypto',
        amount_cents: amountCents,
        currency: 'USD',
        status: 'succeeded',
        blockchain_network: chain.name.toLowerCase(),
        tx_hash,
        from_wallet_address: from_address.toLowerCase(),
        to_wallet_address: expectedWallet,
        token_symbol: tokenSymbol,
        block_number: Number(receipt.blockNumber),
        gas_paid_cents: gasCostCents,
        received_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (tipError) {
      console.error('Error inserting tip:', tipError);
      throw tipError;
    }

    console.log('Tip recorded successfully:', tip.id);

    return new Response(
      JSON.stringify({ success: true, tip_id: tip.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error recording crypto tip:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
