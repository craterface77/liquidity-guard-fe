"use client";

import { isAddress, type Address } from "viem";

type MaybeAddress = Address | undefined;

function normalizeAddress(value: string | undefined): MaybeAddress {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (isAddress(trimmed)) {
    return trimmed as Address;
  }

  return undefined;
}

function normalizeApiBase(value: string | undefined): string {
  const fallback = "https://api.liq-guard.io";
  if (!value) {
    return fallback;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return fallback;
  }
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function parseChainId(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return parsed;
}

export const env = {
  apiBaseUrl: normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE_URL),
  reservePoolAddress: normalizeAddress(process.env.NEXT_PUBLIC_RESERVE_POOL_ADDRESS),
  policyDistributorAddress: normalizeAddress(process.env.NEXT_PUBLIC_POLICY_DISTRIBUTOR_ADDRESS),
  usdcAddress: normalizeAddress(process.env.NEXT_PUBLIC_USDC_ADDRESS),
  lgusdAddress: normalizeAddress(process.env.NEXT_PUBLIC_LGUSD_ADDRESS),
  targetChainId: parseChainId(process.env.NEXT_PUBLIC_CHAIN_ID),
  curveLpAddress: normalizeAddress(process.env.NEXT_PUBLIC_CURVE_LP_ADDRESS),
  aaveLendingPoolAddress: normalizeAddress(process.env.NEXT_PUBLIC_AAVE_LENDING_POOL_ADDRESS),
  aaveCollateralAddress: normalizeAddress(process.env.NEXT_PUBLIC_AAVE_COLLATERAL_ADDRESS),
  aaveChainId: parseChainId(process.env.NEXT_PUBLIC_AAVE_CHAIN_ID),
} as const;

export type EnvConfig = typeof env;
