"use client";

import { useEffect, useState } from "react";
import { DashboardStats, Wallet } from "@/lib/types";
import SummaryCards from "./SummaryCards";
import CategoryChart from "./CategoryChart";
import TransactionList from "./TransactionList";
import WalletCards from "./WalletCards";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchData = async () => {
    try {
      setError(false);
      const [statsRes, walletsRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/wallets"),
      ]);
      if (!statsRes.ok || !walletsRes.ok) throw new Error("Failed");
      const [statsData, walletsData] = await Promise.all([
        statsRes.json(),
        walletsRes.json(),
      ]);
      setStats(statsData);
      setWallets(walletsData);
      setLastUpdate(new Date().toLocaleTimeString("id-ID"));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Gagal memuat data</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Terakhir diperbarui: {lastUpdate}
          <button onClick={fetchData} className="ml-2 text-blue-600 hover:text-blue-800" title="Refresh">
            ↻
          </button>
        </p>
      </div>

      <SummaryCards stats={stats} />

      <WalletCards wallets={wallets} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart stats={stats} />
        <TransactionList transactions={stats.recentTransactions} />
      </div>
    </div>
  );
}
