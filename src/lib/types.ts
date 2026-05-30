export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  walletId?: string;
  note?: string;
}

export interface Wallet {
  id: string;
  name: string;
  owner: string;
  type: "bank" | "e-wallet" | "cash";
  balance: number;
  icon: string;
  color: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  recentTransactions: Transaction[];
}

export interface WalletSummary {
  totalCash: number;
  wallets: Wallet[];
}
