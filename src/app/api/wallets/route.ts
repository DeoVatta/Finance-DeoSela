import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "wallets.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const wallets = JSON.parse(raw);
    return NextResponse.json(wallets);
  } catch {
    return NextResponse.json({ error: "Failed to load wallets" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { walletId, newBalance } = await request.json();
    const filePath = path.join(process.cwd(), "src", "data", "wallets.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const wallets = JSON.parse(raw);

    const idx = wallets.findIndex((w: { id: string }) => w.id === walletId);
    if (idx === -1) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    wallets[idx].balance = newBalance;
    fs.writeFileSync(filePath, JSON.stringify(wallets, null, 2));

    return NextResponse.json(wallets[idx]);
  } catch {
    return NextResponse.json({ error: "Failed to update wallet" }, { status: 500 });
  }
}
