import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Transaction, DashboardStats } from "@/lib/types";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "transactions.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const transactions: Transaction[] = JSON.parse(raw);

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // Category breakdown (expenses only)
    const expenses = transactions.filter((t) => t.type === "expense");
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const totalExpenseAmount = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenseAmount > 0 ? Math.round((amount / totalExpenseAmount) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Recent 5 transactions
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const stats: DashboardStats = {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: transactions.length,
      categoryBreakdown,
      recentTransactions,
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
