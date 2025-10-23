"use client";

import { useState, useEffect } from "react";
import { fetchReserveOverview } from "@/lib/api";
import type { ReserveOverview as ReserveOverviewType } from "@/lib/types";

export function ReserveOverview() {
  const [overview, setOverview] = useState<ReserveOverviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        const data = await fetchReserveOverview();
        setOverview(data);
        setError("");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load reserve data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadOverview();

    const interval = setInterval(loadOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !overview) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Reserve Overview</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Reserve Overview</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Reserve Overview</h2>
        <span className="text-xs text-gray-500">
          Updated: {new Date(overview.updatedAt).toLocaleTimeString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Net Asset Value</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(overview.navUSD)}
          </p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Cash Ratio</p>
          <p className="text-2xl font-bold text-green-900">
            {formatPercent(overview.cashRatio)}
          </p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">lgUSD Price Per Share</p>
          <p className="text-2xl font-bold text-purple-900">
            {formatCurrency(overview.lgusdPricePerShare)}
          </p>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Pending Claims</p>
          <p className="text-2xl font-bold text-yellow-900">
            {formatCurrency(overview.pendingClaimsUSD)}
          </p>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Pending Redemptions</p>
          <p className="text-2xl font-bold text-orange-900">
            {formatCurrency(overview.pendingRedemptionsUSD)}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Reserve Health</p>
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                overview.cashRatio > 0.3
                  ? "bg-green-500"
                  : overview.cashRatio > 0.15
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
            <p className="text-2xl font-bold text-gray-900">
              {overview.cashRatio > 0.3
                ? "Healthy"
                : overview.cashRatio > 0.15
                ? "Moderate"
                : "Low"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Available for Claims:</span>
            <span className="ml-2 font-semibold">
              {formatCurrency(overview.navUSD * overview.cashRatio)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Obligations:</span>
            <span className="ml-2 font-semibold">
              {formatCurrency(
                overview.pendingClaimsUSD + overview.pendingRedemptionsUSD
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
