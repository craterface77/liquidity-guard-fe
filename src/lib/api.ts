"use client";

import type {
  ApiErrorResponse,
  PolicyDraft,
  PolicyRecord,
  ProductType,
  ReserveOverview,
  TermDays,
  PoolSummary,
  ClaimPreview,
  ClaimSignatureResponse,
  ClaimRecord,
  ClaimQueueItem,
} from "./types";

import { env } from "./env";

const API_BASE_URL = env.apiBaseUrl;

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ApiErrorResponse;
    const parts = [
      data.error,
      data.message,
      typeof data.details === "string" ? data.details : undefined,
    ].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" — ");
    }
  } catch {
    /* ignore */
  }
  return response.statusText || "Unexpected API error";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await parseErrorResponse(response);
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export async function fetchPools(): Promise<PoolSummary[]> {
  return apiFetch<PoolSummary[]>("/v1/pools");
}

export async function fetchReserveOverview(): Promise<ReserveOverview> {
  return apiFetch<ReserveOverview>("/v1/reserve/overview");
}

export interface CreatePolicyDraftPayload {
  product: ProductType;
  wallet: string;
  params: Record<string, unknown>;
  termDays: TermDays;
  insuredAmount: number;
  idempotencyKey?: string;
}

export async function createPolicyDraft(
  payload: CreatePolicyDraftPayload
): Promise<PolicyDraft> {
  return apiFetch<PolicyDraft>("/v1/policies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface FinalizePolicyPayload {
  draftId: string;
  txHashMint: string;
  premiumTxHash?: string;
}

export async function finalizePolicy({
  draftId,
  ...body
}: FinalizePolicyPayload): Promise<PolicyRecord> {
  return apiFetch<PolicyRecord>(`/v1/policies/${draftId}/finalize`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchPolicies(wallet: string): Promise<PolicyRecord[]> {
  if (!wallet) {
    return [];
  }
  const query = new URLSearchParams({ wallet }).toString();
  return apiFetch<PolicyRecord[]>(`/v1/policies?${query}`);
}

export async function previewClaim(policyId: string): Promise<ClaimPreview> {
  const query = new URLSearchParams({ policyId }).toString();
  return apiFetch<ClaimPreview>(`/v1/claim/preview?${query}`);
}

export async function signClaim(
  policyId: string
): Promise<ClaimSignatureResponse> {
  return apiFetch<ClaimSignatureResponse>("/v1/claim/sign", {
    method: "POST",
    body: JSON.stringify({ policyId }),
  });
}

export async function fetchClaims(wallet: string): Promise<ClaimRecord[]> {
  if (!wallet) {
    return [];
  }
  const query = new URLSearchParams({ wallet }).toString();
  return apiFetch<ClaimRecord[]>(`/v1/claims?${query}`);
}

export async function fetchClaimQueue(): Promise<ClaimQueueItem[]> {
  return apiFetch<ClaimQueueItem[]>("/v1/claims/queue");
}
