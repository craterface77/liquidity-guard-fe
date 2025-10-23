export type PoolState = "Green" | "Yellow" | "Red";

export interface PoolMetrics {
  twap: number | null;
  reserveRatio: number | null;
  updatedAt: string | null;
}

export interface PoolSummary {
  poolId: string;
  chainId: number;
  name: string;
  address: string;
  riskId: string;
  state: PoolState;
  metrics: PoolMetrics;
}

export type ProductType = "DEPEG_LP" | "AAVE_DLP";
export type PolicyType = "CURVE_LP" | "AAVE_DLP";
export type TermDays = 10 | 20 | 30;

export interface QuoteBreakdown {
  [key: string]: unknown;
}

export interface MintParams {
  policyType: number;
  riskId: string;
  insuredAmount: string;
  coverageCap: string;
  deductibleBps: number;
  startAt: number;
  activeAt: number;
  endAt: number;
  extraData: string;
}

export interface OnchainCalldata {
  signature: string;
  deadline: number;
  nonce: string;
  mintParams: MintParams;
  typedData: Record<string, unknown>;
  distributorAddress: string;
  extraData: string;
  premiumAtomic: string;
  coverageCapAtomic: string;
}

export interface PolicyDraft {
  product: ProductType;
  premiumUSD: number;
  coverageCapUSD: number;
  deductibleBps: number;
  cliffHours: number;
  pricingBreakdown: QuoteBreakdown;
  draftId: string;
  wallet: string;
  params: Record<string, unknown>;
  termDays: TermDays;
  insuredAmount: number;
  createdAt: string;
  termsHash: string;
  riskId: string;
  policyType: PolicyType;
  startAt: number;
  activeAt: number;
  endAt: number;
  metadata: Record<string, unknown>;
  onchainCalldata?: OnchainCalldata;
  distributorAddress: string;
  quoteSignature: string;
  quoteDeadline: number;
  quoteNonce: string;
  quoteTypedData: Record<string, unknown>;
  mintParams: MintParams;
}

export type PolicyStatus =
  | "draft"
  | "pending"
  | "active"
  | "expired"
  | "claimed"
  | "queued";

export interface PolicyRecord {
  policyId: string;
  draftId?: string;
  nftTokenId: string;
  policyType: PolicyType;
  riskId: string;
  product: ProductType;
  wallet: string;
  insuredAmount: string;
  termDays: TermDays;
  startAt: number;
  activeAt: number;
  endAt: number;
  claimedUpTo: number;
  nonce: number;
  status: PolicyStatus;
  coverageCapUSD: string;
  deductibleBps: number;
  metadata: Record<string, unknown>;
}

export interface ReserveOverview {
  navUSD: number;
  cashRatio: number;
  pendingClaimsUSD: number;
  pendingRedemptionsUSD: number;
  lgusdPricePerShare: number;
  updatedAt: string;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export type ClaimStatus = "signed" | "queued" | "executed" | "failed";

export interface ClaimPreviewRequest {
  policyId: string;
}

export interface ClaimPreview {
  policyId: string;
  product: ProductType;
  policyType: PolicyType;
  riskId: string;
  S: number;
  E: number;
  payload: Record<string, unknown>;
  payoutEstimate: number;
}

export interface ClaimSignatureRequest {
  policyId: string;
}

export interface ClaimSignatureResponse {
  policyId: string;
  policyType: PolicyType;
  riskId: string;
  eip712Domain: Record<string, unknown>;
  typedData: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  payout: number;
  expiresAt: string;
}

export interface ClaimRecord {
  claimId: string;
  policyId: string;
  product: ProductType;
  status: ClaimStatus;
  payout: number;
  createdAt: string;
  txHash?: string;
}

export interface ClaimQueueItem {
  claimId: string;
  policyId: string;
  product: ProductType;
  riskId: string;
  wallet: string;
  payout: number;
  queuedAt: string;
  status: ClaimStatus;
}
