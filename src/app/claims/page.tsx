"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { fetchPolicies, previewClaim, signClaim, fetchClaims } from "@/lib/api";
import type {
  PolicyRecord,
  ClaimPreview,
  ClaimSignatureResponse,
  ClaimRecord,
} from "@/lib/types";
import { payoutModuleAbi } from "@/lib/contracts";
import { env } from "@/lib/env";
import { AppHeader } from "@/components/AppHeader";

export default function ClaimsPage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [claimPreview, setClaimPreview] = useState<ClaimPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!address) return;

    const loadData = async () => {
      try {
        const [policiesData, claimsData] = await Promise.all([
          fetchPolicies(address),
          fetchClaims(address),
        ]);
        setPolicies(policiesData.filter((p) => p.status === "active"));
        setClaims(claimsData);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };

    loadData();
  }, [address]);

  const handlePreviewClaim = async (policyId: string) => {
    setLoading(true);
    setError("");
    setStatus("Loading claim preview...");

    try {
      const preview = await previewClaim(policyId);
      setClaimPreview(preview);
      setSelectedPolicy(policyId);
      setStatus(`Estimated payout: $${preview.payoutEstimate.toFixed(2)} USDC`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview claim");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!selectedPolicy || !claimPreview || !walletClient || !publicClient)
      return;

    setLoading(true);
    setError("");
    setStatus("Requesting claim signature from validator...");

    try {
      const signedClaim: ClaimSignatureResponse = await signClaim(
        selectedPolicy
      );

      setStatus("Please confirm the transaction in your wallet...");

      const payload = signedClaim.payload as any;

      if (!env.payoutModuleAddress) {
        throw new Error("PAYOUT_MODULE_ADDRESS not configured");
      }

      const txHash = await walletClient.writeContract({
        address: env.payoutModuleAddress,
        abi: payoutModuleAbi,
        functionName: "executeClaim",
        args: [
          BigInt(payload.policyId || selectedPolicy),
          payload.riskId as `0x${string}`,
          BigInt(payload.S || 0),
          BigInt(payload.E || 0),
          BigInt(payload.Lstar || 0),
          BigInt(payload.refValue || 0),
          BigInt(payload.curValue || 0),
          BigInt(payload.payout || 0),
          BigInt(payload.nonce || 0),
          BigInt(payload.deadline || signedClaim.expiresAt),
          signedClaim.signature as `0x${string}`,
        ],
      });

      setStatus("Waiting for transaction confirmation...");

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status === "success") {
        setStatus(
          `✅ Claim executed successfully! Payout: $${signedClaim.payout.toFixed(
            2
          )} USDC`
        );
        setClaimPreview(null);
        setSelectedPolicy(null);

        if (address) {
          const claimsData = await fetchClaims(address);
          setClaims(claimsData);
        }
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit claim");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <AppHeader />
      <section className="claims-panel">
        <h1 className="claims-title">Claims</h1>

        {!address ? (
          <p className="claims-empty">
            Please connect your wallet to view and submit claims.
          </p>
        ) : (
          <>
            {status && (
              <div className="claims-banner claims-banner--info">
                <p>{status}</p>
              </div>
            )}

            {error && (
              <div className="claims-banner claims-banner--error">
                <p>{error}</p>
              </div>
            )}

            {claimPreview && (
              <section className="claims-preview">
                <h2 className="claims-heading">Claim Preview</h2>

                <div className="claims-preview__item">
                  <p className="claims-preview__label">Policy ID</p>
                  <p className="claims-preview__value">
                    {claimPreview.policyId}
                  </p>
                </div>

                <div className="claims-preview__item">
                  <p className="claims-preview__label">Estimated payout</p>
                  <p className="claims-preview__value claims-preview__value--accent">
                    ${claimPreview.payoutEstimate.toFixed(2)} USDC
                  </p>
                </div>

                <div className="claims-preview__grid">
                  <div>
                    <p className="claims-preview__label">Window start</p>
                    <p className="claims-preview__value">
                      {new Date(claimPreview.S * 1000).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="claims-preview__label">Window end</p>
                    <p className="claims-preview__value">
                      {new Date(claimPreview.E * 1000).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSubmitClaim}
                  disabled={loading}
                  className="claims-preview__submit"
                >
                  {loading ? "Processing..." : "Submit Claim"}
                </button>
              </section>
            )}

            <section>
              <h2 className="claims-heading">Claims History</h2>

              {claims.length === 0 ? (
                <p className="claims-empty">No claims yet.</p>
              ) : (
                <div className="claims-table-wrapper">
                  <table className="claims-table">
                    <thead>
                      <tr>
                        <th>Claim ID</th>
                        <th>Policy ID</th>
                        <th>Product</th>
                        <th>Payout</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map((claim) => (
                        <tr key={claim.claimId}>
                          <td>{claim.claimId.slice(0, 8)}...</td>
                          <td>{claim.policyId}</td>
                          <td>{claim.product}</td>
                          <td>${claim.payout.toFixed(2)}</td>
                          <td>
                            <span
                              className={`claims-status-badge claims-status-badge--${claim.status}`}
                            >
                              {claim.status}
                            </span>
                          </td>
                          <td>
                            {new Date(claim.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
