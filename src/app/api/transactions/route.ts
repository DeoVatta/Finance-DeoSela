import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "transactions.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const transactions = JSON.parse(raw);
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filePath = path.join(process.cwd(), "src", "data", "transactions.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const transactions = JSON.parse(raw);

    const newTx = {
      id: `tx-${Date.now()}`,
      date: body.date || new Date().toISOString().split("T")[0],
      description: body.description,
      amount: Number(body.amount),
      category: body.category || "Uncategorized",
      type: body.type || "expense",
      note: body.note || "",
    };

    transactions.push(newTx);
    fs.writeFileSync(filePath, JSON.stringify(transactions, null, 2));

    return NextResponse.json(newTx, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add transaction" }, { status: 500 });
  }
}
