import { NextResponse } from "next/server";
import { sql } from "@/lib/neon";

export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM transactions ORDER BY date DESC, created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = `tx-${Date.now()}`;
    const date = body.date || new Date().toISOString().split("T")[0];

    await sql`
      INSERT INTO transactions (id, date, description, amount, category, type, wallet_id, note)
      VALUES (${id}, ${date}, ${body.description}, ${Number(body.amount)}, ${body.category || "Uncategorized"}, ${body.type || "expense"}, ${body.walletId || null}, ${body.note || ""})
    `;

    const [newTx] = await sql`SELECT * FROM transactions WHERE id = ${id}`;
    return NextResponse.json(newTx, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to add transaction" }, { status: 500 });
  }
}
