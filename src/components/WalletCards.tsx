"use client";

import { Wallet } from "@/lib/types";

const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

interface Props {
  wallets: Wallet[];
}

const typeLabels: Record<string, string> = {
  bank: "Bank",
  "e-wallet": "E-Wallet",
  cash: "Tunai",
};

export default function WalletCards({ wallets }: Props) {
  const total = wallets.reduce((sum, w) => sum + w.balance, 0);

  const grouped = wallets.reduce<Record<string, Wallet[]>>((acc, w) => {
    const group = w.owner;
    if (!acc[group]) acc[group] = [];
    acc[group].push(w);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">💰 Dompet</h2>
        <span className="text-sm font-medium text-blue-600">
          Total: {formatRupiah(total)}
        </span>
      </div>

      {Object.entries(grouped).map(([owner, ownerWallets]) => (
        <div key={owner} className="mb-4 last:mb-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            {owner}
          </p>
          <div className="space-y-2">
            {ownerWallets.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ borderLeftColor: w.color, borderLeftWidth: 4 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{w.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{w.name}</p>
                    <p className="text-xs text-gray-400">{typeLabels[w.type] || w.type}</p>
                  </div>
                </div>
                <p className="font-semibold text-sm">{formatRupiah(w.balance)}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
