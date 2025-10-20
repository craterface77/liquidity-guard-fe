"use client";

import { ReactNode } from "react";
import { WagmiConfig } from "wagmi";

import { ensureWeb3Modal, wagmiConfig } from "@/lib/web3modal";

type Web3ModalProviderProps = {
  children: ReactNode;
};

export function Web3ModalProvider({ children }: Web3ModalProviderProps) {
  ensureWeb3Modal();
  return <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>;
}
