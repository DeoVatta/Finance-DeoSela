"use client";

import { Transaction } from "@/lib/types";

const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

interface Props {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Transaksi Terbaru</h2>
        <p className="text-gray-400 text-center py-8">Belum ada transaksi</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-lg font-semibold mb-4">Transaksi Terbaru</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 font-medium">Tanggal</th>
              <th className="pb-2 font-medium">Keterangan</th>
              <th className="pb-2 font-medium">Kategori</th>
              <th className="pb-2 font-medium text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 text-gray-600">{formatDate(tx.date)}</td>
                <td className="py-3">
                  <span className="font-medium">{tx.description}</span>
                  {tx.note && (
                    <span className="text-gray-400 text-xs ml-2">{tx.note}</span>
                  )}
                </td>
                <td className="py-3">
                  <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                    {tx.category}
                  </span>
                </td>
                <td className={`py-3 text-right font-medium ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {tx.type === "income" ? "+" : "-"}
                  {formatRupiah(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
