import { NextResponse } from "next/server";
import { sql } from "@/lib/neon";

export async function GET() {
  try {
    const wallets = await sql`
      SELECT * FROM wallets ORDER BY owner, type, name
    `;
    return NextResponse.json(wallets);
  } catch (error) {
    console.error("GET /api/wallets error:", error);
    return NextResponse.json({ error: "Failed to load wallets" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { walletId, newBalance } = await request.json();

    const [updated] = await sql`
      UPDATE wallets SET balance = ${Number(newBalance)}
      WHERE id = ${walletId}
      RETURNING *
    `;

    if (!updated) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/wallets error:", error);
    return NextResponse.json({ error: "Failed to update wallet" }, { status: 500 });
  }
}
