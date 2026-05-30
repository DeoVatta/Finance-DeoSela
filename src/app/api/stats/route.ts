import { NextResponse } from "next/server";
import { sql } from "@/lib/neon";

export async function GET() {
  try {
    const [incomeResult, expenseResult, txCount, categoryData, recentTx] = await Promise.all([
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'`,
      sql`SELECT COUNT(*) as count FROM transactions`,
      sql`
        SELECT category, SUM(amount) as amount,
               ROUND(SUM(amount) * 100.0 / NULLIF((SELECT SUM(amount) FROM transactions WHERE type = 'expense'), 0), 0) as percentage
        FROM transactions WHERE type = 'expense'
        GROUP BY category ORDER BY amount DESC
      `,
      sql`
        SELECT * FROM transactions
        ORDER BY date DESC, created_at DESC
        LIMIT 5
      `,
    ]);

    const totalIncome = Number(incomeResult[0].total);
    const totalExpense = Number(expenseResult[0].total);
    const balance = totalIncome - totalExpense;

    const categoryBreakdown = categoryData.map((r: any) => ({
      category: r.category,
      amount: Number(r.amount),
      percentage: Number(r.percentage),
    }));

    const stats = {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: Number(txCount[0].count),
      categoryBreakdown,
      recentTransactions: recentTx,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
