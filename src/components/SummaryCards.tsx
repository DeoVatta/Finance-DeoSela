"use client";

import { DashboardStats } from "@/lib/types";

const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

interface Props {
  stats: DashboardStats;
}

export default function SummaryCards({ stats }: Props) {
  const cards = [
    {
      label: "Total Pemasukan",
      value: formatRupiah(stats.totalIncome),
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
    },
    {
      label: "Total Pengeluaran",
      value: formatRupiah(stats.totalExpense),
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
    },
    {
      label: "Saldo",
      value: formatRupiah(stats.balance),
      color: stats.balance >= 0 ? "text-blue-600" : "text-red-600",
      bg: "bg-blue-50 border-blue-200",
    },
    {
      label: "Total Transaksi",
      value: stats.transactionCount.toString(),
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border p-4 ${card.bg}`}>
          <p className="text-sm text-gray-500 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
