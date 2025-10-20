"use client";

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

const projectIdEnv = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectIdEnv) {
  throw new Error(
    "WalletConnect Project ID is missing. Please define NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in your environment."
  );
}

const projectId: string = projectIdEnv;

const metadata = {
  name: "LiquidityGuard",
  description:
    "LiquidityGuard — on-chain coverage protocol for DeFi risk mitigation.",
  url: "https://liquidityguard.app",
  icons: ["https://avatars.githubusercontent.com/u/37784886?s=200&v=4"],
};

const chains = [sepolia, mainnet, arbitrum, optimism, polygon, base];

export const wagmiConfig = defaultWagmiConfig({
  projectId,
  chains,
  metadata,
});

export function ensureWeb3Modal(): void {
  if (
    typeof window === "undefined" ||
    window.__LIQUIDITY_GUARD_WEB3_MODAL_INITIALIZED__
  ) {
    return;
  }

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

if (typeof window !== "undefined") {
  ensureWeb3Modal();
}
