import { WagmiProvider } from 'wagmi';
import { mainnet, base, baseSepolia, polygon, arbitrum } from 'wagmi/chains';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { ReactNode } from 'react';

const config = getDefaultConfig({
  appName: 'Table Review',
  projectId: '533e66fa9de789942f2da01fc1ddb3a7',
  chains: [baseSepolia, base, polygon, arbitrum, mainnet],
  ssr: false,
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider>
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
