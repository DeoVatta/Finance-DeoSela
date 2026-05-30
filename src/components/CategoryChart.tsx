"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { DashboardStats } from "@/lib/types";

const COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
];

interface Props {
  stats: DashboardStats;
}

const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

export default function CategoryChart({ stats }: Props) {
  const data = stats.categoryBreakdown;

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Pengeluaran per Kategori</h2>
        <p className="text-gray-400 text-center py-8">Belum ada data pengeluaran</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-lg font-semibold mb-4">Pengeluaran per Kategori</h2>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={50}
            label={({ name }: { name?: string }) => name}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          {/* @ts-expect-error - Recharts formatter type mismatch */}
          <Tooltip formatter={(value: number) => formatRupiah(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
