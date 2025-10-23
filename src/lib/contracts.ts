import type { Abi } from "viem";

export const reservePoolAbi = [
  {
    type: "function",
    name: "asset",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "shareToken",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "pricePerShare",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "currentNav",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalManagedAssets",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
] as const satisfies Abi;

export const policyDistributorAbi = [
  {
    type: "function",
    name: "asset",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "reservePool",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "nonces",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "buyPolicy",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "policyType", type: "uint8" },
          { name: "riskId", type: "bytes32" },
          { name: "insuredAmount", type: "uint256" },
          { name: "coverageCap", type: "uint256" },
          { name: "deductibleBps", type: "uint32" },
          { name: "startAt", type: "uint64" },
          { name: "activeAt", type: "uint64" },
          { name: "endAt", type: "uint64" },
          { name: "extraData", type: "bytes" },
        ],
      },
      { name: "premium", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [{ name: "policyId", type: "uint256" }],
  },
] as const satisfies Abi;

export const payoutModuleAbi = [
  {
    type: "function",
    name: "executeClaim",
    stateMutability: "nonpayable",
    inputs: [
      { name: "policyId", type: "uint256" },
      { name: "riskId", type: "bytes32" },
      { name: "S", type: "uint64" },
      { name: "E", type: "uint64" },
      { name: "Lstar", type: "uint256" },
      { name: "refValue", type: "uint256" },
      { name: "curValue", type: "uint256" },
      { name: "payout", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "policyNonces",
    stateMutability: "view",
    inputs: [{ name: "policyId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const satisfies Abi;

export const policyNftAbi = [
  {
    type: "function",
    name: "getPoliciesByUser",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "policyData",
    stateMutability: "view",
    inputs: [{ name: "policyId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "policyType", type: "uint8" },
          { name: "riskId", type: "bytes32" },
          { name: "insuredAmount", type: "uint128" },
          { name: "coverageCap", type: "uint128" },
          { name: "deductibleBps", type: "uint32" },
          { name: "startAt", type: "uint64" },
          { name: "activeAt", type: "uint64" },
          { name: "endAt", type: "uint64" },
          { name: "claimedUpTo", type: "uint64" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "dlpPolicyData",
    stateMutability: "view",
    inputs: [{ name: "policyId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "chainId", type: "uint32" },
          { name: "aavePool", type: "address" },
          { name: "collateralAsset", type: "address" },
          { name: "coverageRatioBps", type: "uint16" },
          { name: "maxPayoutBps", type: "uint16" },
        ],
      },
    ],
  },
] as const satisfies Abi;
