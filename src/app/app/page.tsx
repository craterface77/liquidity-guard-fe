"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BaseError, formatUnits, parseUnits, type Address } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";

import { AppHeader } from "@/components/AppHeader";

import { env } from "@/lib/env";
import { createPolicyDraft, fetchPools, finalizePolicy } from "@/lib/api";
import { policyDistributorAbi, reservePoolAbi } from "@/lib/contracts";
import type { PolicyDraft, PoolSummary, TermDays } from "@/lib/types";

const termOptions: TermDays[] = [10, 20, 30];

const erc20Abi = [
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

function parseErrorMessage(error: unknown): string {
  if (error instanceof BaseError) {
    return error.shortMessage ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}

function shorten(value: string | null | undefined, chars = 4): string {
  if (!value) return "";
  return `${value.slice(0, chars)}…${value.slice(-chars)}`;
}

function formatNumber(
  value: string | null | undefined,
  maximumFractionDigits = 4
): string {
  if (!value) return "0";
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber)) return value;
  return asNumber.toLocaleString(undefined, { maximumFractionDigits });
}

function cleanAmount(input: string): number | null {
  const normalized = input.replace(/,/g, "").trim();
  if (!normalized) return null;
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric;
}

function randomId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function AppPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: env.targetChainId });
  const { data: walletClient } = useWalletClient();
  const { open } = useWeb3Modal();

  const {
    reservePoolAddress,
    policyDistributorAddress,
    usdcAddress,
    lgusdAddress,
    targetChainId,
    curveLpAddress,
    aaveLendingPoolAddress,
    aaveCollateralAddress,
    aaveChainId,
  } = env;

  const tokenDecimalsCache = useRef<Map<Address, number>>(new Map());

  const [curvePool, setCurvePool] = useState<PoolSummary | null>(null);
  const [poolsError, setPoolsError] = useState<string | null>(null);

  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [curveBalance, setCurveBalance] = useState<string | null>(null);
  const [aaveBalance, setAaveBalance] = useState<string | null>(null);
  const [lgusdBalance, setLgusdBalance] = useState<string | null>(null);
  const [shareTokenAddress, setShareTokenAddress] = useState<Address | null>(
    lgusdAddress ?? null
  );
  const [shareTokenDecimals, setShareTokenDecimals] = useState<number | null>(
    null
  );
  const [pricePerShare, setPricePerShare] = useState<bigint | null>(null);
  const [assetDecimals, setAssetDecimals] = useState<number>(6);

  const [curveAmountInput, setCurveAmountInput] = useState<string>("500");
  const [curveQuote, setCurveQuote] = useState<PolicyDraft | null>(null);
  const [curveQuoteLoading, setCurveQuoteLoading] = useState<boolean>(false);
  const [curveQuoteError, setCurveQuoteError] = useState<string | null>(null);
  const [curvePurchaseStatus, setCurvePurchaseStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [curvePurchaseMessage, setCurvePurchaseMessage] = useState<string | null>(null);
  const [curveTermDays, setCurveTermDays] = useState<TermDays>(30);

  const [aaveAmountInput, setAaveAmountInput] = useState<string>("1000");
  const [aaveQuote, setAaveQuote] = useState<PolicyDraft | null>(null);
  const [aaveQuoteLoading, setAaveQuoteLoading] = useState<boolean>(false);
  const [aaveQuoteError, setAaveQuoteError] = useState<string | null>(null);
  const [aavePurchaseStatus, setAavePurchaseStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [aavePurchaseMessage, setAavePurchaseMessage] = useState<string | null>(null);
  const [aaveTermDays, setAaveTermDays] = useState<TermDays>(30);

  const [depositAmountInput, setDepositAmountInput] = useState<string>("1000");
  const [depositStatus, setDepositStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [depositMessage, setDepositMessage] = useState<string | null>(null);
  const [usdcMintStatus, setUsdcMintStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [usdcMintMessage, setUsdcMintMessage] = useState<string | null>(null);
  const [curveMintStatus, setCurveMintStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [curveMintMessage, setCurveMintMessage] = useState<string | null>(null);
  const [aaveMintStatus, setAaveMintStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [aaveMintMessage, setAaveMintMessage] = useState<string | null>(null);

  const wrongNetwork =
    Boolean(targetChainId) &&
    typeof chainId === "number" &&
    chainId !== targetChainId;

  const ensureWalletReady = useCallback((): boolean => {
    if (!isConnected || !address) {
      void open();
      return false;
    }
    if (wrongNetwork) {
      return false;
    }
    if (!walletClient || !publicClient) {
      return false;
    }
    return true;
  }, [address, isConnected, open, publicClient, walletClient, wrongNetwork]);

  const getTokenDecimals = useCallback(
    async (token: Address): Promise<number> => {
      const cached = tokenDecimalsCache.current.get(token);
      if (cached !== undefined) {
        return cached;
      }
      if (!publicClient) {
        throw new Error("Public client unavailable");
      }
      const decimalsValue = await publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "decimals",
      });
      const decimalsNumber = Number(decimalsValue);
      tokenDecimalsCache.current.set(token, decimalsNumber);
      return decimalsNumber;
    },
    [publicClient]
  );

  const refreshPools = useCallback(async () => {
    try {
      const data = await fetchPools();
      if (curveLpAddress) {
        const match = data.find(
          (pool) => pool.address.toLowerCase() === curveLpAddress.toLowerCase()
        );
        if (match) {
          setCurvePool(match);
          setPoolsError(null);
          return;
        }
      }
      const fallback = data.find((pool) =>
        pool.name.toLowerCase().includes("curve")
      );
      setCurvePool(fallback ?? data[0] ?? null);
      setPoolsError(null);
    } catch (error) {
      setCurvePool(null);
      setPoolsError(parseErrorMessage(error));
    }
  }, [curveLpAddress]);

  const refreshBalances = useCallback(async () => {
    if (!publicClient) return;

    const holder = address;
    const needsWallet = isConnected && holder;

    try {
      if (reservePoolAddress) {
        let tokenAddress = shareTokenAddress;
        if (!tokenAddress) {
          const readAddress = await publicClient.readContract({
            address: reservePoolAddress,
            abi: reservePoolAbi,
            functionName: "shareToken",
          });
          tokenAddress = readAddress as Address;
          setShareTokenAddress(tokenAddress);
        }

        const shareDecimals = await getTokenDecimals(tokenAddress!);
        setShareTokenDecimals(shareDecimals);

        const pps = await publicClient.readContract({
          address: reservePoolAddress,
          abi: reservePoolAbi,
          functionName: "pricePerShare",
        });
        setPricePerShare(BigInt(pps as bigint));

        if (needsWallet) {
          const balance = await publicClient.readContract({
            address: tokenAddress!,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [holder!],
          });
          setLgusdBalance(formatUnits(balance as bigint, shareDecimals));
        } else {
          setLgusdBalance(null);
        }
      }

      if (needsWallet && usdcAddress) {
        const decimals = await getTokenDecimals(usdcAddress);
        setAssetDecimals(decimals);
        const balance = await publicClient.readContract({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [holder!],
        });
        setUsdcBalance(formatUnits(balance as bigint, decimals));
      } else {
        setUsdcBalance(null);
      }

      if (needsWallet && curveLpAddress) {
        const decimals = await getTokenDecimals(curveLpAddress);
        const balance = await publicClient.readContract({
          address: curveLpAddress,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [holder!],
        });
        setCurveBalance(formatUnits(balance as bigint, decimals));
      } else {
        setCurveBalance(null);
      }

      if (needsWallet && aaveCollateralAddress) {
        const decimals = await getTokenDecimals(aaveCollateralAddress);
        const balance = await publicClient.readContract({
          address: aaveCollateralAddress,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [holder!],
        });
        setAaveBalance(formatUnits(balance as bigint, decimals));
      } else {
        setAaveBalance(null);
      }
    } catch (error) {
      setPoolsError((prev) => prev ?? parseErrorMessage(error));
    }
  }, [
    address,
    curveLpAddress,
    getTokenDecimals,
    isConnected,
    publicClient,
    reservePoolAddress,
    shareTokenAddress,
    usdcAddress,
    aaveCollateralAddress,
  ]);

  useEffect(() => {
    void refreshPools();
  }, [refreshPools]);

  useEffect(() => {
    void refreshBalances();
  }, [refreshBalances]);

  useEffect(() => {
    if (!address) return;
    void refreshBalances();
  }, [address, refreshBalances]);

  const handleCurveQuote = useCallback(async () => {
    setCurveQuoteError(null);
    setCurvePurchaseStatus("idle");
    setCurvePurchaseMessage(null);

    const amount = cleanAmount(curveAmountInput);
    if (!amount) {
      setCurveQuoteError("Enter the LP token amount you want to cover.");
      return;
    }

    if (!ensureWalletReady()) {
      setCurveQuoteError("Connect your wallet on the supported network.");
      return;
    }

    if (!address) {
      setCurveQuoteError("Wallet is not available.");
      return;
    }

    const poolId = curvePool?.poolId ?? "curve-usdc-usdf";

    setCurveQuoteLoading(true);
  try {
    const draft = await createPolicyDraft({
      product: "DEPEG_LP",
      wallet: address,
      termDays: curveTermDays,
      insuredAmount: amount,
      params: { poolId },
      idempotencyKey: randomId(),
    });
    setCurveQuote(draft);
    } catch (error) {
      setCurveQuote(null);
      setCurveQuoteError(parseErrorMessage(error));
    } finally {
      setCurveQuoteLoading(false);
    }
}, [address, curveAmountInput, curvePool?.poolId, curveTermDays, ensureWalletReady]);

  const handleCurvePurchase = useCallback(async () => {
    if (!curveQuote) {
      setCurvePurchaseStatus("error");
      setCurvePurchaseMessage("Request a quote before purchasing coverage.");
      return;
    }

    if (!ensureWalletReady() || !walletClient || !publicClient || !address) {
      setCurvePurchaseStatus("error");
      setCurvePurchaseMessage("Wallet client is not available.");
      return;
    }

    if (!usdcAddress) {
      setCurvePurchaseStatus("error");
      setCurvePurchaseMessage("USDC contract address is not configured.");
      return;
    }

    const distributor =
      (curveQuote.onchainCalldata?.distributorAddress ??
        curveQuote.distributorAddress ??
        policyDistributorAddress) ||
      null;

    if (!distributor) {
      setCurvePurchaseStatus("error");
      setCurvePurchaseMessage("PolicyDistributor address is missing.");
      return;
    }

    try {
      setCurvePurchaseStatus("pending");
      setCurvePurchaseMessage(null);

      const premiumAtomic =
        curveQuote.onchainCalldata?.premiumAtomic ??
        parseUnits(curveQuote.premiumUSD.toFixed(6), 6).toString();
      const premium = BigInt(premiumAtomic);

      const allowance = (await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, distributor as Address],
      })) as bigint;

      if (allowance < premium) {
        const approveHash = await walletClient.writeContract({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [distributor as Address, premium],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      const buyHash = await walletClient.writeContract({
        address: distributor as Address,
        abi: policyDistributorAbi,
        functionName: "buyPolicy",
        args: [
          {
            policyType: curveQuote.mintParams.policyType,
            riskId: curveQuote.mintParams.riskId as `0x${string}`,
            insuredAmount: BigInt(curveQuote.mintParams.insuredAmount),
            coverageCap: BigInt(curveQuote.mintParams.coverageCap),
            deductibleBps: curveQuote.mintParams.deductibleBps,
            startAt: BigInt(curveQuote.mintParams.startAt),
            activeAt: BigInt(curveQuote.mintParams.activeAt),
            endAt: BigInt(curveQuote.mintParams.endAt),
            extraData: curveQuote.mintParams.extraData as `0x${string}`,
          },
          premium,
          BigInt(curveQuote.quoteDeadline),
          (curveQuote.onchainCalldata?.signature ??
            curveQuote.quoteSignature) as `0x${string}`,
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash: buyHash });
      await finalizePolicy({
        draftId: curveQuote.draftId,
        txHashMint: buyHash,
      });

      setCurvePurchaseStatus("success");
      setCurvePurchaseMessage(`Coverage purchased: ${shorten(buyHash)}`);
      setCurveQuote(null);
      setCurveAmountInput("500");
      await refreshBalances();
    } catch (error) {
      setCurvePurchaseStatus("error");
      setCurvePurchaseMessage(parseErrorMessage(error));
    }
  }, [
    address,
    curveQuote,
    ensureWalletReady,
    policyDistributorAddress,
    publicClient,
    refreshBalances,
    usdcAddress,
    walletClient,
  ]);

  const handleAaveQuote = useCallback(async () => {
    setAaveQuoteError(null);
    setAavePurchaseStatus("idle");
    setAavePurchaseMessage(null);

    const amount = cleanAmount(aaveAmountInput);
    if (!amount) {
      setAaveQuoteError("Enter the insured notional in USDC.");
      return;
    }

    if (!ensureWalletReady()) {
      setAaveQuoteError("Connect your wallet on the supported network.");
      return;
    }

    if (!address) {
      setAaveQuoteError("Wallet is not available.");
      return;
    }

    if (!aaveLendingPoolAddress || !aaveCollateralAddress) {
      setAaveQuoteError(
        "Set Aave pool and collateral addresses in the environment."
      );
      return;
    }

    const coverageChainId = aaveChainId ?? targetChainId ?? chainId ?? 0;

    setAaveQuoteLoading(true);
  try {
    const draft = await createPolicyDraft({
      product: "AAVE_DLP",
      wallet: address,
      termDays: aaveTermDays,
      insuredAmount: amount,
      params: {
        chainId: coverageChainId,
        lendingPool: aaveLendingPoolAddress,
        collateralAsset: aaveCollateralAddress,
        },
        idempotencyKey: randomId(),
      });
      setAaveQuote(draft);
    } catch (error) {
      setAaveQuote(null);
      setAaveQuoteError(parseErrorMessage(error));
    } finally {
      setAaveQuoteLoading(false);
    }
  }, [
    aaveAmountInput,
    aaveChainId,
    aaveCollateralAddress,
    aaveLendingPoolAddress,
    address,
    chainId,
    ensureWalletReady,
    targetChainId,
    aaveTermDays,
  ]);

  const handleAavePurchase = useCallback(async () => {
    if (!aaveQuote) {
      setAavePurchaseStatus("error");
      setAavePurchaseMessage("Request a quote before purchasing coverage.");
      return;
    }

    if (!ensureWalletReady() || !walletClient || !publicClient || !address) {
      setAavePurchaseStatus("error");
      setAavePurchaseMessage("Wallet client is not available.");
      return;
    }

    if (!usdcAddress) {
      setAavePurchaseStatus("error");
      setAavePurchaseMessage("USDC contract address is not configured.");
      return;
    }

    const distributor =
      (aaveQuote.onchainCalldata?.distributorAddress ??
        aaveQuote.distributorAddress ??
        policyDistributorAddress) ||
      null;

    if (!distributor) {
      setAavePurchaseStatus("error");
      setAavePurchaseMessage("PolicyDistributor address is missing.");
      return;
    }

    try {
      setAavePurchaseStatus("pending");
      setAavePurchaseMessage(null);

      const premiumAtomic =
        aaveQuote.onchainCalldata?.premiumAtomic ??
        parseUnits(aaveQuote.premiumUSD.toFixed(6), 6).toString();
      const premium = BigInt(premiumAtomic);

      const allowance = (await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, distributor as Address],
      })) as bigint;

      if (allowance < premium) {
        const approveHash = await walletClient.writeContract({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [distributor as Address, premium],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      const buyHash = await walletClient.writeContract({
        address: distributor as Address,
        abi: policyDistributorAbi,
        functionName: "buyPolicy",
        args: [
          {
            policyType: aaveQuote.mintParams.policyType,
            riskId: aaveQuote.mintParams.riskId as `0x${string}`,
            insuredAmount: BigInt(aaveQuote.mintParams.insuredAmount),
            coverageCap: BigInt(aaveQuote.mintParams.coverageCap),
            deductibleBps: aaveQuote.mintParams.deductibleBps,
            startAt: BigInt(aaveQuote.mintParams.startAt),
            activeAt: BigInt(aaveQuote.mintParams.activeAt),
            endAt: BigInt(aaveQuote.mintParams.endAt),
            extraData: aaveQuote.mintParams.extraData as `0x${string}`,
          },
          premium,
          BigInt(aaveQuote.quoteDeadline),
          (aaveQuote.onchainCalldata?.signature ??
            aaveQuote.quoteSignature) as `0x${string}`,
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash: buyHash });
      await finalizePolicy({ draftId: aaveQuote.draftId, txHashMint: buyHash });

      setAavePurchaseStatus("success");
      setAavePurchaseMessage(`Coverage purchased: ${shorten(buyHash)}`);
      setAaveQuote(null);
      setAaveAmountInput("1000");
      await refreshBalances();
    } catch (error) {
      setAavePurchaseStatus("error");
      setAavePurchaseMessage(parseErrorMessage(error));
    }
  }, [
    aaveQuote,
    address,
    ensureWalletReady,
    policyDistributorAddress,
    publicClient,
    refreshBalances,
    usdcAddress,
    walletClient,
  ]);

  const handleDeposit = useCallback(async () => {
    setDepositMessage(null);

    const amount = cleanAmount(depositAmountInput);
    if (!amount) {
      setDepositStatus("error");
      setDepositMessage("Enter the USDC amount you want to deposit.");
      return;
    }

    if (!ensureWalletReady() || !walletClient || !publicClient || !address) {
      setDepositStatus("error");
      setDepositMessage("Wallet client is not available.");
      return;
    }

    if (!reservePoolAddress || !usdcAddress) {
      setDepositStatus("error");
      setDepositMessage(
        "Set reserve pool and USDC addresses in the environment."
      );
      return;
    }

    try {
      setDepositStatus("pending");
      const atomic = parseUnits(amount.toString(), assetDecimals);

      const allowance = (await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, reservePoolAddress],
      })) as bigint;

      if (allowance < atomic) {
        const approveHash = await walletClient.writeContract({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [reservePoolAddress, atomic],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      const depositHash = await walletClient.writeContract({
        address: reservePoolAddress,
        abi: reservePoolAbi,
        functionName: "deposit",
        args: [atomic, address],
      });

      await publicClient.waitForTransactionReceipt({ hash: depositHash });
      setDepositStatus("success");
      setDepositMessage(`Deposit confirmed: ${shorten(depositHash)}`);
      await refreshBalances();
    } catch (error) {
      setDepositStatus("error");
      setDepositMessage(parseErrorMessage(error));
    }
  }, [
    address,
    assetDecimals,
    depositAmountInput,
    ensureWalletReady,
    publicClient,
    refreshBalances,
    reservePoolAddress,
    usdcAddress,
    walletClient,
  ]);

  const handleMintToken = useCallback(
    async (
      tokenAddress: Address | undefined,
      setStatus: (s: "idle" | "pending" | "success" | "error") => void,
      setMessage: (msg: string | null) => void,
      label: string
    ) => {
      setMessage(null);
      if (!tokenAddress) {
        setStatus("error");
        setMessage(`${label} token address is not configured.`);
        return;
      }

      if (!ensureWalletReady() || !walletClient || !publicClient || !address) {
        setStatus("error");
        setMessage("Wallet client is not available.");
        return;
      }

      try {
        setStatus("pending");
        const amount = parseUnits("1000", 6);

        const txHash = await walletClient.writeContract({
          address: tokenAddress,
          abi: [
            {
              type: "function",
              name: "mint",
              stateMutability: "nonpayable",
              inputs: [
                { name: "to", type: "address" },
                { name: "amount", type: "uint256" },
              ],
              outputs: [],
            },
          ] as const,
          functionName: "mint",
          args: [address, amount],
        });

        await publicClient.waitForTransactionReceipt({ hash: txHash });
        setStatus("success");
        setMessage(`Minted 1000 ${label}: ${shorten(txHash)}`);
        await refreshBalances();
      } catch (error) {
        setStatus("error");
        setMessage(parseErrorMessage(error));
      }
    },
    [address, ensureWalletReady, publicClient, refreshBalances, walletClient]
  );

  const estimatedLgUsd = useMemo(() => {
    const amount = cleanAmount(depositAmountInput);
    if (
      !amount ||
      !pricePerShare ||
      pricePerShare === BigInt(0) ||
      shareTokenDecimals === null ||
      assetDecimals == null
    ) {
      return "-";
    }

    const atomic = parseUnits(amount.toString(), assetDecimals);
    let scaling = BigInt(1);
    const base = BigInt(10);
    const exponent = BigInt(assetDecimals);
    for (let i = BigInt(0); i < exponent; i = i + BigInt(1)) {
      scaling *= base;
    }
    const sharesAtomic = (atomic * scaling) / pricePerShare;
    const formatted = formatUnits(sharesAtomic, shareTokenDecimals);
    return `${formatNumber(formatted, 6)} lgUSD`;
  }, [assetDecimals, depositAmountInput, pricePerShare, shareTokenDecimals]);

  return (
    <main className="app-shell">
      <AppHeader />

      {wrongNetwork && (
        <p className="status status--warning">
          Switch your wallet to chain {targetChainId} before interacting with
          the protocol.
        </p>
      )}

      {poolsError && <p className="status status--error">{poolsError}</p>}

      <section className="card-grid">
        <article className="card">
          <header className="card__header">
            <h2>Curve USDC/USDf</h2>
            <p>
              Protect Curve stable LP tokens against depeg windows and liquidity
              freezes.
            </p>
          </header>
          <dl className="card__balances">
            <div>
              <dt>LP balance</dt>
              <dd>{formatNumber(curveBalance)} tokens</dd>
            </div>
            <div>
              <dt>Coverage term</dt>
              <dd>{curveTermDays} days</dd>
            </div>
          </dl>
          <label className="card__label">LP amount to cover</label>
          <input
            className="card__input"
            type="text"
            inputMode="decimal"
            placeholder="500"
            value={curveAmountInput}
            onChange={(event) => setCurveAmountInput(event.target.value)}
            disabled={curveQuoteLoading}
          />
          <label className="card__label">Coverage term</label>
          <select
            className="card__input"
            value={curveTermDays}
            onChange={(event) =>
              setCurveTermDays(Number(event.target.value) as TermDays)
            }
            disabled={curveQuoteLoading}
          >
            {termOptions.map((term) => (
              <option key={term} value={term}>
                {term} days
              </option>
            ))}
          </select>
          <div className="card__actions">
            <button
              className="button button--ghost"
              type="button"
              onClick={handleCurveQuote}
              disabled={curveQuoteLoading}
            >
              {curveQuoteLoading ? "Requesting…" : "Request quote"}
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={handleCurvePurchase}
              disabled={!curveQuote || curvePurchaseStatus === "pending"}
            >
              {curvePurchaseStatus === "pending"
                ? "Minting…"
                : "Purchase coverage"}
            </button>
          </div>
          {curveQuoteError && (
            <p className="status status--error">{curveQuoteError}</p>
          )}
          {curvePurchaseMessage && (
            <p
              className={`status ${
                curvePurchaseStatus === "success"
                  ? "status--success"
                  : "status--error"
              }`}
            >
              {curvePurchaseMessage}
            </p>
          )}
          {curveQuote && (
            <div className="quote">
              <p>
                Premium:{" "}
                <strong>
                  {curveQuote.premiumUSD.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  USDC
                </strong>
              </p>
              <p>
                Coverage cap:{" "}
                <strong>
                  {curveQuote.coverageCapUSD.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  USDC
                </strong>
              </p>
              <p>
                Deductible: <strong>{curveQuote.deductibleBps / 100}%</strong>
              </p>
            </div>
          )}
        </article>

        <article className="card">
          <header className="card__header">
            <h2>Aave aPYUSD</h2>
            <p>
              Shield aPYUSD collateral from liquidation cascades triggered by
              health factor drops.
            </p>
          </header>
          <dl className="card__balances">
            <div>
              <dt>Collateral balance</dt>
              <dd>{formatNumber(aaveBalance)} aPYUSD</dd>
            </div>
            <div>
              <dt>Coverage term</dt>
              <dd>{aaveTermDays} days</dd>
            </div>
          </dl>
          <label className="card__label">Insured amount (aPYUSD)</label>
          <input
            className="card__input"
            type="text"
            inputMode="decimal"
            placeholder="1000"
            value={aaveAmountInput}
            onChange={(event) => setAaveAmountInput(event.target.value)}
            disabled={aaveQuoteLoading}
          />
          <label className="card__label">Coverage term</label>
          <select
            className="card__input"
            value={aaveTermDays}
            onChange={(event) =>
              setAaveTermDays(Number(event.target.value) as TermDays)
            }
            disabled={aaveQuoteLoading}
          >
            {termOptions.map((term) => (
              <option key={term} value={term}>
                {term} days
              </option>
            ))}
          </select>
          <div className="card__actions">
            <button
              className="button button--ghost"
              type="button"
              onClick={handleAaveQuote}
              disabled={aaveQuoteLoading}
            >
              {aaveQuoteLoading ? "Requesting…" : "Request quote"}
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={handleAavePurchase}
              disabled={!aaveQuote || aavePurchaseStatus === "pending"}
            >
              {aavePurchaseStatus === "pending"
                ? "Minting…"
                : "Purchase coverage"}
            </button>
          </div>
          {aaveQuoteError && (
            <p className="status status--error">{aaveQuoteError}</p>
          )}
          {aavePurchaseMessage && (
            <p
              className={`status ${
                aavePurchaseStatus === "success"
                  ? "status--success"
                  : "status--error"
              }`}
            >
              {aavePurchaseMessage}
            </p>
          )}
          {aaveQuote && (
            <div className="quote">
              <p>
                Premium:{" "}
                <strong>
                  {aaveQuote.premiumUSD.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  USDC
                </strong>
              </p>
              <p>
                Coverage cap:{" "}
                <strong>
                  {aaveQuote.coverageCapUSD.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  USDC
                </strong>
              </p>
              <p>
                Deductible: <strong>{aaveQuote.deductibleBps / 100}%</strong>
              </p>
            </div>
          )}
        </article>

        <article className="card">
          <header className="card__header">
            <h2>Deposit to reserve</h2>
            <p>Supply USDC to mint lgUSD and share protocol yield.</p>
          </header>
          <dl className="card__balances">
            <div>
              <dt>USDC balance</dt>
              <dd>{formatNumber(usdcBalance)} USDC</dd>
            </div>
            <div>
              <dt>lgUSD balance</dt>
              <dd>{formatNumber(lgusdBalance)} lgUSD</dd>
            </div>
          </dl>
          <label className="card__label">Deposit amount (USDC)</label>
          <input
            className="card__input"
            type="text"
            inputMode="decimal"
            placeholder="1000"
            value={depositAmountInput}
            onChange={(event) => setDepositAmountInput(event.target.value)}
            disabled={depositStatus === "pending"}
          />
          <p className="card__helper">Estimated mint: {estimatedLgUsd}</p>
          <button
            className="button button--primary"
            type="button"
            onClick={handleDeposit}
            disabled={depositStatus === "pending"}
          >
            {depositStatus === "pending" ? "Depositing…" : "Deposit USDC"}
          </button>
          {depositMessage && (
            <p
              className={`status ${
                depositStatus === "success"
                  ? "status--success"
                  : "status--error"
              }`}
            >
              {depositMessage}
            </p>
          )}
        </article>
      </section>

      <section className="mint-grid">
        <article className="mint-card">
          <h3>Mint USDC (test)</h3>
          <p>Mint 1,000 USDC test tokens to your wallet.</p>
          <button
            className="button button--ghost"
            type="button"
            onClick={() =>
              handleMintToken(
                usdcAddress,
                setUsdcMintStatus,
                setUsdcMintMessage,
                "USDC"
              )
            }
            disabled={usdcMintStatus === "pending"}
          >
            {usdcMintStatus === "pending" ? "Minting…" : "Mint 1000"}
          </button>
          {usdcMintMessage && (
            <p
              className={`status ${
                usdcMintStatus === "success"
                  ? "status--success"
                  : "status--error"
              }`}
            >
              {usdcMintMessage}
            </p>
          )}
        </article>
        <article className="mint-card">
          <h3>Mint Curve LP (test)</h3>
          <p>Mint 1,000 Curve stable LP test tokens to your wallet.</p>
          <button
            className="button button--ghost"
            type="button"
            onClick={() =>
              handleMintToken(
                curveLpAddress,
                setCurveMintStatus,
                setCurveMintMessage,
                "Curve LP"
              )
            }
            disabled={curveMintStatus === "pending"}
          >
            {curveMintStatus === "pending" ? "Minting…" : "Mint 1000"}
          </button>
          {curveMintMessage && (
            <p
              className={`status ${
                curveMintStatus === "success"
                  ? "status--success"
                  : "status--error"
              }`}
            >
              {curveMintMessage}
            </p>
          )}
        </article>
        <article className="mint-card">
          <h3>Mint aPYUSD (test)</h3>
          <p>
            Mint 1,000 aPYUSD collateral tokens for liquidation coverage
            testing.
          </p>
          <button
            className="button button--ghost"
            type="button"
            onClick={() =>
              handleMintToken(
                aaveCollateralAddress,
                setAaveMintStatus,
                setAaveMintMessage,
                "aPYUSD"
              )
            }
            disabled={aaveMintStatus === "pending"}
          >
            {aaveMintStatus === "pending" ? "Minting…" : "Mint 1000"}
          </button>
          {aaveMintMessage && (
            <p
              className={`status ${
                aaveMintStatus === "success"
                  ? "status--success"
                  : "status--error"
              }`}
            >
              {aaveMintMessage}
            </p>
          )}
        </article>
      </section>
    </main>
  );
}

export default dynamic(() => Promise.resolve(AppPage), { ssr: false });
