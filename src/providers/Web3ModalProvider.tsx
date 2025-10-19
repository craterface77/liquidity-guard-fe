"use client";

import { ReactNode } from "react";
import { WagmiConfig } from "wagmi";
import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from "wagmi/chains";

declare global {
  interface Window {
    __LIQUIDITY_GUARD_WEB3_MODAL_INITIALIZED__?: boolean;
  }
}

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "WalletConnect Project ID is missing. Please define NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in your environment."
  );
}

const metadata = {
  name: "LiquidityGuard",
  description:
    "LiquidityGuard — on-chain coverage protocol for DeFi risk mitigation.",
  url: "https://liquidityguard.app",
  icons: ["https://avatars.githubusercontent.com/u/37784886?s=200&v=4"],
};

const chains = [sepolia, mainnet, arbitrum, optimism, polygon, base];

const wagmiConfig = defaultWagmiConfig({
  projectId,
  chains,
  metadata,
  enableAnalytics: false,
});

if (
  typeof window !== "undefined" &&
  !window.__LIQUIDITY_GUARD_WEB3_MODAL_INITIALIZED__
) {
  createWeb3Modal({
    wagmiConfig,
    projectId,
    chains,
    themeMode: "light",
    themeVariables: {
      "--w3m-accent": "#5b6bff",
      "--w3m-font-family": "Open Sauce One, system-ui, sans-serif",
    },
  });

  window.__LIQUIDITY_GUARD_WEB3_MODAL_INITIALIZED__ = true;
}

type Web3ModalProviderProps = {
  children: ReactNode;
};

export function Web3ModalProvider({ children }: Web3ModalProviderProps) {
  return <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>;
}
