"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";

function shorten(value: string | null | undefined, chars = 4): string {
  if (!value) return "Connect wallet";
  return `${value.slice(0, chars)}…${value.slice(-chars)}`;
}

export function AppHeader(): JSX.Element {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();

  const walletLabel = useMemo(() => {
    if (!isConnected || !address) return "Connect wallet";
    return shorten(address);
  }, [address, isConnected]);

  const handleConnectClick = () => {
    if (isConnected) {
      void open({ view: "Account" });
    } else {
      void open();
    }
  };

  return (
    <header className="app-header">
      <div className="app-brand">
        <a className="app-brand__mark" href="/">
          LG
        </a>
        <div>
          <p className="app-brand__title">LiquidityGuard</p>
          <p className="app-brand__subtitle">
            On-chain coverage &amp; liquidity
          </p>
        </div>
      </div>

      <nav className="app-nav" aria-label="Primary">
        <Link
          className={`app-nav__link${
            pathname === "/app" ? " app-nav__link--active" : ""
          }`}
          href="/app"
        >
          Insurance Policy
        </Link>
        <Link
          className={`app-nav__link${
            pathname?.startsWith("/app/my-insurances")
              ? " app-nav__link--active"
              : ""
          }`}
          href="/app/my-insurances"
        >
          My insurances
        </Link>
        <Link
          className={`app-nav__link${
            pathname?.startsWith("/claims") ? " app-nav__link--active" : ""
          }`}
          href="/claims"
        >
          Claims
        </Link>
      </nav>

      <button
        className="button button--primary"
        type="button"
        onClick={handleConnectClick}
      >
        {walletLabel}
      </button>
    </header>
  );
}
