import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, base, polygon, arbitrum } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { ReactNode } from 'react';

const config = getDefaultConfig({
  appName: 'Table Review',
  projectId: 'e6c0e6c8a5e5c8c0e6c8a5e5c8c0e6c8', // WalletConnect project ID - get from walletconnect.com
  chains: [base, polygon, arbitrum, mainnet],
  ssr: false,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
