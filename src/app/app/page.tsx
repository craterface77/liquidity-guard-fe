"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";

const tabs = [
  { label: "Buy coverage", active: true },
  { label: "Your policies", active: false },
  { label: "Claims desk", active: false },
];

const listingFilters = [
  "Multi-market cover",
  "Stablecoins",
  "Lending pools",
  "Liquidity pools",
];

const listings = [
  {
    name: "lgUSD Stability Pool",
    provider: "LiquidityGuard Reserve",
    status: "New",
    fee: "2.30% → 3.10%",
    capacity: "3.2m lgUSD / 5.8m USDC",
    description:
      "Protects against lgUSD deviation and Curve liquidity freezes.",
  },
  {
    name: "Tri-Stable Vault",
    provider: "Curve Guard",
    status: "Hot",
    fee: "1.85% → 2.40%",
    capacity: "4.6m DAI / 6.2m USDT",
    description:
      "Coverage for 3Pool liquidity drains and oracle desync events.",
  },
  {
    name: "EigenLayer Restake",
    provider: "Sentinel Collective",
    status: "",
    fee: "3.95% → 4.25%",
    capacity: "9.4k ETH / 26.3m USD",
    description: "Safeguards slashing and restaking downtime losses.",
  },
  {
    name: "Aave Stable Rate",
    provider: "Protocol Nexus",
    status: "",
    fee: "1.20% → 1.65%",
    capacity: "2.1m USDC / 3.0m GHO",
    description: "Protective layer for lending freezes and oracle halts.",
  },
];

const stats = [
  {
    label: "Policies active",
    value: "1,842",
    helper: "+128 this week",
  },
  {
    label: "Cover capacity",
    value: "$124.6M",
    helper: "Across 38 protocols",
  },
  {
    label: "Claims paid",
    value: "$9.3M",
    helper: "Proofs anchored on IPFS",
  },
];

export default function AppPage() {
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();

  const walletLabel = useMemo(() => {
    if (isConnected && address) {
      return `${address.slice(0, 6)}…${address.slice(-4)}`;
    }
    return "Connect wallet";
  }, [address, isConnected]);

  const handleWalletClick = useCallback(() => {
    if (isConnected) {
      void open({ view: "Account" });
    } else {
      void open();
    }
  }, [isConnected, open]);

  return (
    <main className="app-page">
      <header className="app-page__header">
        <div className="app-page__brand">
          <div className="app-page__brand-icon">LG</div>
          <div>
            <p className="app-page__brand-title">LiquidityGuard</p>
            <p className="app-page__brand-subtitle">
              Coverage network for DeFi risk
            </p>
          </div>
        </div>
        <nav className="app-page__nav">
          <a className="app-page__nav-item app-page__nav-item--active">Cover</a>
          <a className="app-page__nav-item">Dashboard</a>
          <a className="app-page__nav-item">Stake</a>
          <a className="app-page__nav-item">Claims</a>
          <a className="app-page__nav-item">Governance</a>
        </nav>
        <div className="app-page__actions">
          <Link href="/" className="link">
            ← Back to site
          </Link>
          <button className="button button--ghost">Become a member</button>
          <button
            className="button button--primary"
            onClick={handleWalletClick}
            type="button"
          >
            {walletLabel}
          </button>
        </div>
      </header>

      <section className="app-page__content">
        <section className="app-page__left">
          <div className="app-tabs">
            <div className="app-tabs__list">
              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  className={`app-tabs__item ${
                    tab.active ? "app-tabs__item--active" : ""
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="app-tabs__helper">
              Policies minted are represented by NFTs with on-chain proofs.
            </div>
          </div>

          <div className="app-panel">
            <div className="app-panel__header">
              <div>
                <h2>Coverage marketplace</h2>
                <p>
                  Browse listings and request capacity across reviewed pools.
                </p>
              </div>
              <button className="button button--link">Request capacity</button>
            </div>

            <div className="app-panel__search">
              <label className="field">
                <span className="field__icon" aria-hidden="true">
                  🔍
                </span>
                <input
                  type="search"
                  placeholder="Search for a coverage listing"
                  aria-label="Search for a coverage listing"
                />
              </label>
              <div className="pill-group">
                {listingFilters.map((filter) => (
                  <button key={filter} className="pill">
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <ul className="listing">
              {listings.map((listing) => (
                <li key={listing.name} className="listing__item">
                  <div className="listing__icon" aria-hidden="true">
                    {listing.name.charAt(0)}
                  </div>
                  <div className="listing__meta">
                    <div className="listing__top">
                      <p className="listing__name">{listing.name}</p>
                      {listing.status && (
                        <span className="listing__badge">{listing.status}</span>
                      )}
                    </div>
                    <p className="listing__provider">{listing.provider}</p>
                    <p className="listing__description">
                      {listing.description}
                    </p>
                  </div>
                  <div className="listing__metrics">
                    <p className="listing__fee">{listing.fee}</p>
                    <p className="listing__capacity">{listing.capacity}</p>
                  </div>
                  <button className="listing__cta">View details</button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="app-page__aside">
          <section className="summary">
            <h3>Protocol health</h3>
            <div className="summary__grid">
              {stats.map((stat) => (
                <article className="summary__card" key={stat.label}>
                  <p className="summary__value">{stat.value}</p>
                  <p className="summary__label">{stat.label}</p>
                  <p className="summary__helper">{stat.helper}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="summary summary--muted">
            <h3>Why LiquidityGuard?</h3>
            <ul className="summary__list">
              <li>
                Depeg windows recorded with validator attestations published to
                IPFS for transparent claims.
              </li>
              <li>
                Premium flows shared with liquidity providers who stake lgUSD
                into the reserve.
              </li>
              <li>
                Automated payouts routed on-chain the moment risk conditions are
                met.
              </li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
