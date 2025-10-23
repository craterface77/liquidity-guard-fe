"use client";

import { useEffect, useMemo, useState } from "react";
import { BaseError, formatUnits, type Address } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
} from "wagmi";

import { AppHeader } from "@/components/AppHeader";
import { env } from "@/lib/env";
import { policyNftAbi } from "@/lib/contracts";

type PolicyType = 0 | 1;

type RawPolicyData = {
  policyType: PolicyType;
  riskId: `0x${string}`;
  insuredAmount: bigint;
  coverageCap: bigint;
  deductibleBps: number;
  startAt: bigint;
  activeAt: bigint;
  endAt: bigint;
  claimedUpTo: bigint;
};

type RawDlpPolicyData = {
  chainId: number;
  aavePool: Address;
  collateralAsset: Address;
  coverageRatioBps: number;
  maxPayoutBps: number;
};

type LoadedPolicy = {
  id: bigint;
  data: RawPolicyData;
  dlp?: RawDlpPolicyData | null;
};

function parseErrorMessage(error: unknown): string {
  if (error instanceof BaseError) {
    return error.shortMessage ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}

function shortenHex(value: string | null | undefined, chars = 4): string {
  if (!value) return "";
  if (value.length <= 2 + chars * 2) {
    return value;
  }
  return `${value.slice(0, 2 + chars)}…${value.slice(-chars)}`;
}

function formatDate(value: bigint): string {
  const numeric = Number(value);
  if (!numeric) return "-";
  return new Date(numeric * 1000).toLocaleString();
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) {
    return "0s";
  }
  const units: Array<[string, number]> = [
    ["d", 86_400],
    ["h", 3_600],
    ["m", 60],
    ["s", 1],
  ];
  const parts: string[] = [];
  let remaining = seconds;

  for (const [label, unitValue] of units) {
    const count = Math.floor(remaining / unitValue);
    if (count > 0) {
      parts.push(`${count}${label}`);
      remaining -= count * unitValue;
    }
    if (parts.length >= 3) break;
  }

  if (parts.length === 0) {
    return "0s";
  }

  return parts.join(" ");
}

function formatBasisPoints(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

function formatAmount(value: bigint, decimals = 6, maximumFractionDigits = 2): string {
  const asString = formatUnits(value, decimals);
  const numeric = Number(asString);
  if (!Number.isFinite(numeric)) {
    return asString;
  }
  return numeric.toLocaleString(undefined, { maximumFractionDigits });
}

function policyTypeLabel(policyType: PolicyType): string {
  if (policyType === 0) return "Curve LP Coverage";
  if (policyType === 1) return "Aave DLP Coverage";
  return "Unknown coverage";
}

function statusLabel(now: number, data: RawPolicyData) {
  const start = Number(data.startAt);
  const active = Number(data.activeAt);
  const end = Number(data.endAt);

  if (now < active) {
    return {
      status: "Pending activation",
      label: "Activates in",
      detail: formatCountdown(Math.max(active - now, 0)),
    };
  }

  if (now < end) {
    return {
      status: "Active",
      label: "Time remaining",
      detail: formatCountdown(Math.max(end - now, 0)),
    };
  }

  return {
    status: "Expired",
    label: "Expired on",
    detail: formatDate(data.endAt),
  };
}

function MyInsurancesPage(): JSX.Element {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: env.targetChainId });

  const [policies, setPolicies] = useState<LoadedPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000));

  const {
    targetChainId,
    policyNftAddress,
  } = env;

  const wrongNetwork =
    Boolean(targetChainId) &&
    typeof chainId === "number" &&
    chainId !== targetChainId;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!address || !policyNftAddress || !publicClient || wrongNetwork) {
      setPolicies([]);
      return;
    }

    let cancelled = false;

    const fetchPolicies = async () => {
      setLoading(true);
      setError(null);

      try {
        const policyIds = (await publicClient.readContract({
          address: policyNftAddress,
          abi: policyNftAbi,
          functionName: "getPoliciesByUser",
          args: [address],
        })) as readonly bigint[];

        if (cancelled) return;

        if (!policyIds.length) {
          setPolicies([]);
          return;
        }

        const detailed = await Promise.all(
          policyIds.map(async (policyId) => {
            const base = (await publicClient.readContract({
              address: policyNftAddress,
              abi: policyNftAbi,
              functionName: "policyData",
              args: [policyId],
            })) as RawPolicyData;

            if (cancelled) {
              return null;
            }

            let dlp: RawDlpPolicyData | null = null;
            if (base.policyType === 1) {
              try {
                dlp = (await publicClient.readContract({
                  address: policyNftAddress,
                  abi: policyNftAbi,
                  functionName: "dlpPolicyData",
                  args: [policyId],
                })) as RawDlpPolicyData;
              } catch (dlpError) {
                console.error("Failed to load DLP policy data", dlpError);
              }
            }

            return { id: policyId, data: base, dlp };
          })
        );

        if (cancelled) return;

        setPolicies(detailed.filter(Boolean) as LoadedPolicy[]);
      } catch (fetchError) {
        if (cancelled) return;
        setError(parseErrorMessage(fetchError));
        setPolicies([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchPolicies();

    return () => {
      cancelled = true;
    };
  }, [address, policyNftAddress, publicClient, wrongNetwork]);

  const content = useMemo(() => {
    if (!isConnected || !address) {
      return (
        <p className="status status--info">
          Connect your wallet to view purchased policies.
        </p>
      );
    }

    if (wrongNetwork) {
      return (
        <p className="status status--warning">
          Switch your wallet to chain {targetChainId} to view policies.
        </p>
      );
    }

    if (!policyNftAddress) {
      return (
        <p className="status status--error">
          Policy NFT contract address is not configured.
        </p>
      );
    }

    if (error) {
      return (
        <p className="status status--error">
          {error}
        </p>
      );
    }

    if (loading) {
      return (
        <p className="status status--info">Loading policies…</p>
      );
    }

    if (!policies.length) {
      return (
        <p className="status status--info">No policies found for your wallet.</p>
      );
    }

    return (
      <section className="card-grid">
        {policies.map((policy) => {
          const { status, label, detail } = statusLabel(now, policy.data);

          return (
            <article className="card" key={policy.id.toString()}>
              <header className="card__header">
                <h3>Policy #{policy.id.toString()}</h3>
                <p>{policyTypeLabel(policy.data.policyType)}</p>
              </header>
              <dl className="card__balances">
                <div>
                  <dt>Status</dt>
                  <dd>{status}</dd>
                </div>
                <div>
                  <dt>{label}</dt>
                  <dd>{detail}</dd>
                </div>
                <div>
                  <dt>Start date</dt>
                  <dd>{formatDate(policy.data.startAt)}</dd>
                </div>
                <div>
                  <dt>Active from</dt>
                  <dd>{formatDate(policy.data.activeAt)}</dd>
                </div>
                <div>
                  <dt>End date</dt>
                  <dd>{formatDate(policy.data.endAt)}</dd>
                </div>
                <div>
                  <dt>Insured amount</dt>
                  <dd>{formatAmount(policy.data.insuredAmount)} tokens</dd>
                </div>
                <div>
                  <dt>Coverage cap</dt>
                  <dd>{formatAmount(policy.data.coverageCap)} tokens</dd>
                </div>
                <div>
                  <dt>Deductible</dt>
                  <dd>{formatBasisPoints(policy.data.deductibleBps)}</dd>
                </div>
                <div>
                  <dt>Risk ID</dt>
                  <dd><code>{shortenHex(policy.data.riskId)}</code></dd>
                </div>
                <div>
                  <dt>Claimed up to</dt>
                  <dd>{policy.data.claimedUpTo === BigInt(0) ? "Not claimed" : formatDate(policy.data.claimedUpTo)}</dd>
                </div>
                {policy.dlp && (
                  <>
                    <div>
                      <dt>Chain ID</dt>
                      <dd>{policy.dlp.chainId}</dd>
                    </div>
                    <div>
                      <dt>Aave pool</dt>
                      <dd><code>{shortenHex(policy.dlp.aavePool)}</code></dd>
                    </div>
                    <div>
                      <dt>Collateral asset</dt>
                      <dd><code>{shortenHex(policy.dlp.collateralAsset)}</code></dd>
                    </div>
                    <div>
                      <dt>Coverage ratio</dt>
                      <dd>{formatBasisPoints(policy.dlp.coverageRatioBps)}</dd>
                    </div>
                    <div>
                      <dt>Max payout</dt>
                      <dd>{formatBasisPoints(policy.dlp.maxPayoutBps)}</dd>
                    </div>
                  </>
                )}
              </dl>
            </article>
          );
        })}
      </section>
    );
  }, [
    address,
    error,
    isConnected,
    loading,
    now,
    policies,
    policyNftAddress,
    wrongNetwork,
    targetChainId,
  ]);

  return (
    <main className="app-shell">
      <AppHeader />
      {content}
    </main>
  );
}

export default MyInsurancesPage;
