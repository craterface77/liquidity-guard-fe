import Link from "next/link";

const features = [
  {
    title: "On-chain coverage",
    description:
      "Protocol-native risk engine monitors liquidity pools and lending markets to respond instantly to depeg events.",
  },
  {
    title: "Provable claims",
    description:
      "Validator network records depeg windows with cryptographic proof anchored on IPFS to ensure transparent payouts.",
  },
  {
    title: "Investor yield",
    description:
      "NFT policy premiums flow into a reserve pool backed by lgUSD holders, creating a new class of insurance yield.",
  },
];

export default function HomePage() {
  return (
    <main className="landing">
      <header className="landing__header">
        <Link href="/" className="landing__brand"></Link>
        <Link href="/app" className="landing__app-link">
          <span>APP</span>
          <svg
            className="landing__app-icon"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 5h10v10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 15 15 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </header>

      <section className="landing__hero">
        <div className="landing__hero-copy">
          <h1 className="landing__title">
            Liquidity
            <br />
            Guard
          </h1>
          <p className="landing__subtitle">Protect your stablecoin position</p>
          <p className="landing__copy">
            LiquidityGuard is an on-chain insurance protocol built to protect
            DeFi participants from stablecoin depegs and liquidity freezes
            across pools and lending markets. Coverage is minted as NFT
            policies, validator attestations document every depeg window, and
            payouts stream directly from capital reserves collateralized by
            lgUSD holders.
          </p>
          <div className="landing__actions">
            <Link href="/app" className="button button--primary">
              Launch app
            </Link>
            <a
              href="#learn-more"
              className="button button--ghost"
              aria-label="Scroll to learn more"
            >
              Learn more
            </a>
          </div>
        </div>
        <div className="landing__hero-media">
          <div className="landing__hero-video">
            <video
              className="landing__hero-video-player"
              src="/liq-guard.mp4"
              autoPlay
              loop
              muted
              playsInline
              aria-label="Animated liquidity sphere illustrating protocol responsiveness"
            />
          </div>
        </div>
      </section>

      <section id="learn-more" className="landing__features">
        {features.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
