// Price fetching and conversion utilities for crypto payments
// Uses CoinGecko free API with caching to avoid rate limits

interface PriceCache {
  [key: string]: {
    price: number;
    timestamp: number;
  };
}

const priceCache: PriceCache = {};
const CACHE_DURATION = 60000; // 1 minute

const COINGECKO_IDS: { [key: string]: string } = {
  ETH: 'ethereum',
  MATIC: 'matic-network',
  USDC: 'usd-coin',
  USDT: 'tether',
};

export async function getTokenPrice(symbol: string): Promise<number> {
  const cacheKey = symbol.toUpperCase();
  const cached = priceCache[cacheKey];
  
  // Return cached price if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }

  try {
    const coinId = COINGECKO_IDS[cacheKey];
    if (!coinId) {
      throw new Error(`Unsupported token: ${symbol}`);
    }

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch price');
    }

    const data = await response.json();
    const price = data[coinId]?.usd;

    if (!price) {
      throw new Error('Price not found');
    }

    // Cache the price
    priceCache[cacheKey] = {
      price,
      timestamp: Date.now(),
    };

    return price;
  } catch (error) {
    console.error('Error fetching token price:', error);
    // Return cached price even if expired as fallback
    if (cached) {
      return cached.price;
    }
    throw error;
  }
}

export function usdToCrypto(usdAmount: number, tokenPrice: number, decimals: number = 18): string {
  const cryptoAmount = usdAmount / tokenPrice;
  return cryptoAmount.toFixed(decimals === 6 ? 6 : 8); // USDC has 6 decimals
}

export function cryptoToUsd(cryptoAmount: string, tokenPrice: number): number {
  const amount = parseFloat(cryptoAmount);
  return amount * tokenPrice;
}

export function formatTokenAmount(amount: string, symbol: string): string {
  const decimals = symbol === 'USDC' || symbol === 'USDT' ? 2 : 6;
  const num = parseFloat(amount);
  return num.toFixed(decimals);
}
